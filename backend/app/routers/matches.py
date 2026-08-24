"""
Match Schedule — THE shared Match Schedule endpoints used by:
  - Admin -> Schedule Management -> Create Schedule -> Match
  - Coach -> Matches -> Add Match Schedule
Both pages read/write the exact same `matches` table rows through this one
router, so there is never more than one record per scheduled match.

Player -> My Schedule only needs GET (any logged-in role); Create/Edit/
Cancel/Delete are Admin-or-Coach only (require_staff).

Tournament Management's own nested endpoints
(/admin/tournaments/{id}/matches, .../matches/{id}/result) still exist
separately for that page's own "Manage Tournament" detail view, but they
operate on this SAME `matches` table — never a separate copy.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Match, Tournament
from ..schemas import MatchCreate, MatchUpdate, MatchOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/matches", tags=["matches"])


def _m_out(m: Match) -> MatchOut:
    return MatchOut(
        id=m.public_id, opponent=m.opponent,
        tournamentId=m.tournament.public_id if m.tournament else None,
        date=m.date, time=m.time.strftime("%H:%M") if m.time else None, venue=m.venue,
        format=m.format, tournament=m.tournament.name if m.tournament else None,
        status=m.status, result=m.result,
    )


def _parse_time(value):
    if not value:
        return None
    from datetime import datetime as _dt
    return _dt.strptime(value, "%H:%M").time()


def _resolve_tournament(db: Session, tournament_id) -> Optional[Tournament]:
    """tournament_id is a Tournament's public_id (e.g. "T001"), "" , or None.
    "" and None both mean Friendly/None (no tournament)."""
    if not tournament_id:
        return None
    t = db.query(Tournament).filter(Tournament.public_id == tournament_id).first()
    if t is None:
        raise HTTPException(status_code=400, detail="Selected tournament was not found.")
    return t


def _match_has_linked_records(db: Session, m: Match) -> bool:
    """
    Delete-safety check: a Match Schedule must not be deleted once real
    player Match Performance records exist for it. That backend/table is
    out of scope for this task and doesn't exist yet, so this always
    returns False today — but every caller already goes through this one
    function, so wiring in the real check later (query a MatchPerformance
    table by match_id) needs no other code to change.
    """
    return False


@router.get("", response_model=List[MatchOut])
def list_matches(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [_m_out(m) for m in db.query(Match).order_by(Match.id).all()]


@router.post("", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
def create_match(payload: MatchCreate, db: Session = Depends(get_db), _=Depends(require_staff)):
    tournament = _resolve_tournament(db, payload.tournamentId)
    m = Match(
        public_id=next_public_id(db, "M", model=Match), opponent=payload.opponent,
        tournament_id=tournament.id if tournament else None,
        date=payload.date, time=_parse_time(payload.time), venue=payload.venue,
        format="T20", status=payload.status or "Scheduled",
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _m_out(m)


def _get_match_or_404(db: Session, match_id: str) -> Match:
    m = db.query(Match).filter(Match.public_id == match_id).first()
    if m is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return m


@router.get("/{match_id}", response_model=MatchOut)
def get_match(match_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _m_out(_get_match_or_404(db, match_id))


@router.put("/{match_id}", response_model=MatchOut)
def update_match(match_id: str, payload: MatchUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    m = _get_match_or_404(db, match_id)
    if payload.opponent is not None:
        m.opponent = payload.opponent
    if payload.tournamentId is not None:
        tournament = _resolve_tournament(db, payload.tournamentId)
        m.tournament_id = tournament.id if tournament else None
    if payload.date is not None:
        m.date = payload.date
    if payload.time is not None:
        m.time = _parse_time(payload.time)
    if payload.venue is not None:
        m.venue = payload.venue
    if payload.status is not None:
        m.status = payload.status
    db.commit()
    db.refresh(m)
    return _m_out(m)


@router.patch("/{match_id}/cancel", response_model=MatchOut)
def cancel_match(match_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    m = _get_match_or_404(db, match_id)
    m.status = "Cancelled"
    db.commit()
    db.refresh(m)
    return _m_out(m)


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match(match_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    m = _get_match_or_404(db, match_id)
    if _match_has_linked_records(db, m):
        raise HTTPException(
            status_code=400,
            detail="This schedule cannot be deleted because records are already linked to it. Cancel the schedule instead.",
        )
    db.delete(m)
    db.commit()
