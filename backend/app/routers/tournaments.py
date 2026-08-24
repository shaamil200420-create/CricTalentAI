"""
Tournament Management — GET/POST/PUT + Cancel backing TournamentManagement.jsx,
plus nested match endpoints for that page's "Add Match" / "Record Result"
actions inside its Manage Tournament modal. Admin-only. T20 only.

Cancel is status-only (never a hard delete), matching the existing page.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Tournament, Match
from ..schemas import (
    TournamentCreate, TournamentUpdate, TournamentOut,
    MatchCreate, MatchResultUpdate, MatchOut,
)
from ..auth import require_admin, require_staff, next_public_id

router = APIRouter(prefix="/admin/tournaments", tags=["tournaments"])


def _t_out(t: Tournament) -> TournamentOut:
    return TournamentOut(
        id=t.public_id, name=t.name, format=t.format, startDate=t.start_date,
        endDate=t.end_date, teams=t.teams, status=t.status,
    )


def _m_out(m: Match) -> MatchOut:
    return MatchOut(
        id=m.public_id, opponent=m.opponent,
        tournamentId=m.tournament.public_id if m.tournament else None,
        date=m.date, time=m.time.strftime("%H:%M") if m.time else None, venue=m.venue,
        format=m.format, tournament=m.tournament.name if m.tournament else None,
        status=m.status, result=m.result,
    )


@router.get("", response_model=List[TournamentOut])
def list_tournaments(db: Session = Depends(get_db), _=Depends(require_staff)):
    # Admin manages tournaments; Coach only needs this list to populate the
    # Tournament dropdown on the shared Match Schedule Form — read-only.
    return [_t_out(t) for t in db.query(Tournament).order_by(Tournament.id).all()]


@router.post("", response_model=TournamentOut, status_code=status.HTTP_201_CREATED)
def create_tournament(payload: TournamentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = Tournament(
        public_id=next_public_id(db, "T", model=Tournament), name=payload.name,
        format="T20", start_date=payload.startDate, end_date=payload.endDate,
        teams=payload.teams or 2, status="Upcoming",
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _t_out(t)


def _get_tournament_or_404(db: Session, tournament_id: str) -> Tournament:
    t = db.query(Tournament).filter(Tournament.public_id == tournament_id).first()
    if t is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return t


@router.get("/{tournament_id}", response_model=TournamentOut)
def get_tournament(tournament_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return _t_out(_get_tournament_or_404(db, tournament_id))


@router.put("/{tournament_id}", response_model=TournamentOut)
def update_tournament(tournament_id: str, payload: TournamentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = _get_tournament_or_404(db, tournament_id)
    if t.status == "Cancelled":
        raise HTTPException(status_code=400, detail="A cancelled tournament cannot be edited.")
    if payload.name is not None:
        t.name = payload.name
    if payload.startDate is not None:
        t.start_date = payload.startDate
    if payload.endDate is not None:
        t.end_date = payload.endDate
    if payload.teams is not None:
        t.teams = payload.teams
    if payload.status is not None:
        t.status = payload.status
    db.commit()
    db.refresh(t)
    return _t_out(t)


@router.patch("/{tournament_id}/cancel", response_model=TournamentOut)
def cancel_tournament(tournament_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = _get_tournament_or_404(db, tournament_id)
    t.status = "Cancelled"
    db.commit()
    db.refresh(t)
    return _t_out(t)


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(tournament_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = _get_tournament_or_404(db, tournament_id)
    # Matches carry a tournament_id foreign key with no DB-level cascade, so
    # they're removed first — deleting a tournament removes its match
    # history with it, matching what the frontend's confirm dialog says.
    db.query(Match).filter(Match.tournament_id == t.id).delete()
    db.delete(t)
    db.commit()


@router.get("/{tournament_id}/matches", response_model=List[MatchOut])
def list_tournament_matches(tournament_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = _get_tournament_or_404(db, tournament_id)
    return [_m_out(m) for m in db.query(Match).filter(Match.tournament_id == t.id).order_by(Match.id).all()]


@router.post("/{tournament_id}/matches", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
def add_tournament_match(tournament_id: str, payload: MatchCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    t = _get_tournament_or_404(db, tournament_id)
    m = Match(
        public_id=next_public_id(db, "M", model=Match), opponent=payload.opponent,
        date=payload.date, venue=payload.venue, format="T20",
        tournament_id=t.id, status="Scheduled",
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _m_out(m)


@router.patch("/matches/{match_id}/result", response_model=MatchOut)
def record_match_result(match_id: str, payload: MatchResultUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    m = db.query(Match).filter(Match.public_id == match_id).first()
    if m is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    m.result = payload.result
    m.status = "Completed"
    db.commit()
    db.refresh(m)
    return _m_out(m)
