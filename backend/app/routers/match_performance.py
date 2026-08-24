"""
Match Performance — real MySQL persistence for:
  - Coach -> Match Entry (create)
  - Coach -> Match Records (view / edit / remove)
  - Player -> My Match Stats (view OWN records only)
replacing the old frontend-only matchPerformanceStore.js (browser
localStorage) demo store, which is no longer the source of truth.

Belongs to an EXISTING Player (`users`, role=PLAYER — the same
users + player_profiles this whole project already uses, never a second
Player table) and an EXISTING Match (`matches` — never a second
fixture/schedule system). Exactly one row may exist per (player, match)
pair; creating a second one for the same pair is rejected with a clear
error telling the Coach to use Match Records -> Edit instead.

Authorization:
  - Coach (and Admin) can create / view (any) / edit / remove.
  - Player can only VIEW their own records — never create/edit/delete,
    and never another player's records even by guessing/changing a URL
    (every player-scoped route checks the authenticated user's own
    public_id against the one requested).
"""
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import User, Match, MatchPerformance
from ..schemas import MatchPerformanceCreate, MatchPerformanceUpdate, MatchPerformanceOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/match-performance", tags=["match-performance"])

# This academy's T20 bowling cap (4.0 overs = 24 legal balls) — same rule
# Match Entry already enforces client-side (utils/cricket.js).
MAX_T20_LEGAL_BALLS = 24
_OVERS_RE_WHOLE = re.compile(r"^\d+$")
_OVERS_RE_PARTIAL = re.compile(r"^\d+\.[0-5]$")


def _legal_balls(overs_text: Optional[str]) -> int:
    """Cricket overs notation ("3.5" = 3 overs + 5 legal balls) -> legal
    balls. None/blank means 0 (did not bowl)."""
    if not overs_text:
        return 0
    parts = str(overs_text).split(".")
    overs = int(parts[0]) if parts[0].isdigit() else 0
    balls = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    if balls > 5:
        balls = 5
    return overs * 6 + balls


def _valid_overs_notation(overs_text: Optional[str]) -> bool:
    if not overs_text:
        return True
    s = str(overs_text).strip()
    return bool(_OVERS_RE_WHOLE.fullmatch(s) or _OVERS_RE_PARTIAL.fullmatch(s))


def _get_player_or_404(db: Session, player_id: str) -> User:
    p = db.query(User).filter(User.public_id == player_id, User.role == "PLAYER").first()
    if p is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return p


def _get_match_or_404(db: Session, match_id: str) -> Match:
    m = db.query(Match).filter(Match.public_id == match_id).first()
    if m is None:
        raise HTTPException(status_code=404, detail="Match not found.")
    return m


def _get_mp_or_404(db: Session, mp_id: str) -> MatchPerformance:
    mp = db.query(MatchPerformance).filter(MatchPerformance.public_id == mp_id).first()
    if mp is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return mp


def _authorize_view(current_user: User, target_player_public_id: str):
    if current_user.role in ("ADMIN", "COACH"):
        return
    if current_user.role == "PLAYER" and current_user.public_id == target_player_public_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own records.")


def _out(mp: MatchPerformance, player_public_id: str, match_public_id: str) -> MatchPerformanceOut:
    return MatchPerformanceOut(
        id=mp.public_id, playerId=player_public_id, matchId=match_public_id,
        battingPosition=mp.batting_position, runs=mp.runs, ballsFaced=mp.balls_faced,
        dismissalType=mp.dismissal_type, fours=mp.fours, sixes=mp.sixes,
        strikeRate=mp.strike_rate, boundaryRuns=mp.boundary_runs,
        oversBowled=mp.overs_bowled, runsConceded=mp.runs_conceded, wickets=mp.wickets,
        maidens=mp.maidens, dotBalls=mp.dot_balls, wides=mp.wides, noBalls=mp.no_balls,
        economyRate=mp.economy_rate,
        catches=mp.catches, droppedCatches=mp.dropped_catches, runOuts=mp.run_outs,
        stumpings=mp.stumpings, misfields=mp.misfields, fieldingScore=mp.fielding_score,
        notes=mp.notes,
    )


def _recompute_and_validate(mp: MatchPerformance, player_role: Optional[str]):
    """
    Reads whatever raw fields are currently set on `mp` (already applied
    from the incoming payload by the caller), enforces the same cricket
    business rules Match Entry/Match Records already enforce client-side
    (never trusting the client to have actually run them), applies the
    Did-Not-Bat / Did-Not-Bowl null-ing rule, and (re)computes the
    derived fields — strike rate, boundary runs, economy rate, fielding
    score — from those raw fields. This is the ONLY place any of these
    fields are ever written.
    """
    did_not_bat = mp.dismissal_type == "Did Not Bat"
    if did_not_bat:
        mp.batting_position = None
        mp.runs = None
        mp.balls_faced = None
        mp.fours = None
        mp.sixes = None
    else:
        mp.runs = mp.runs if mp.runs is not None else 0
        mp.balls_faced = mp.balls_faced if mp.balls_faced is not None else 0
        mp.fours = mp.fours if mp.fours is not None else 0
        mp.sixes = mp.sixes if mp.sixes is not None else 0

    mp.boundary_runs = 4 * (mp.fours or 0) + 6 * (mp.sixes or 0)
    if not did_not_bat and mp.boundary_runs > (mp.runs or 0):
        raise HTTPException(status_code=400, detail="4×fours + 6×sixes cannot exceed total runs entered.")
    mp.strike_rate = round((mp.runs / mp.balls_faced) * 100, 2) if (mp.balls_faced and mp.balls_faced > 0) else None

    if not _valid_overs_notation(mp.overs_bowled):
        raise HTTPException(
            status_code=400,
            detail="Invalid cricket overs — the ball part must be 0–5 (an over has 6 legal balls).",
        )
    legal_balls = _legal_balls(mp.overs_bowled)
    if legal_balls > MAX_T20_LEGAL_BALLS:
        raise HTTPException(status_code=400, detail="Maximum T20 bowling allocation is 4.0 overs.")

    if legal_balls == 0:
        # Did NOT bowl this match — every bowling figure is genuinely
        # not-applicable, not zero (see model docstring).
        mp.overs_bowled = None
        mp.runs_conceded = None
        mp.wickets = None
        mp.maidens = None
        mp.dot_balls = None
        mp.wides = None
        mp.no_balls = None
        mp.economy_rate = None
    else:
        mp.runs_conceded = mp.runs_conceded if mp.runs_conceded is not None else 0
        mp.wickets = mp.wickets if mp.wickets is not None else 0
        mp.maidens = mp.maidens if mp.maidens is not None else 0
        mp.dot_balls = mp.dot_balls if mp.dot_balls is not None else 0
        mp.wides = mp.wides if mp.wides is not None else 0
        mp.no_balls = mp.no_balls if mp.no_balls is not None else 0
        if mp.wickets > 10:
            raise HTTPException(status_code=400, detail="Wickets cannot exceed 10.")
        if mp.dot_balls > legal_balls:
            raise HTTPException(status_code=400, detail="Dot balls cannot exceed legal balls bowled.")
        if mp.maidens > legal_balls // 6:
            raise HTTPException(status_code=400, detail="Maidens cannot exceed completed overs.")
        mp.economy_rate = round(mp.runs_conceded / (legal_balls / 6), 2)

    mp.catches = mp.catches or 0
    mp.dropped_catches = mp.dropped_catches or 0
    mp.run_outs = mp.run_outs or 0
    mp.stumpings = mp.stumpings or 0
    mp.misfields = mp.misfields or 0

    if mp.stumpings > 0 and player_role and player_role != "Wicketkeeper-Batter":
        raise HTTPException(status_code=400, detail="Only a Wicketkeeper-Batter can record stumpings.")

    mp.fielding_score = mp.catches * 8 + mp.run_outs * 10 + mp.stumpings * 10


DUPLICATE_MESSAGE = (
    "A performance record already exists for this player and match. "
    "Coach should use Match Records → Edit instead."
)


@router.post("", response_model=MatchPerformanceOut, status_code=status.HTTP_201_CREATED)
def create_match_performance(payload: MatchPerformanceCreate, db: Session = Depends(get_db), _=Depends(require_staff)):
    player = _get_player_or_404(db, payload.playerId)
    match = _get_match_or_404(db, payload.matchId)

    existing = db.query(MatchPerformance).filter(
        MatchPerformance.player_id == player.id, MatchPerformance.match_id == match.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=DUPLICATE_MESSAGE)

    mp = MatchPerformance(
        public_id=next_public_id(db, "MP", model=MatchPerformance),
        player_id=player.id, match_id=match.id,
        batting_position=payload.battingPosition, runs=payload.runs, balls_faced=payload.ballsFaced,
        dismissal_type=payload.dismissalType, fours=payload.fours, sixes=payload.sixes,
        overs_bowled=payload.oversBowled, runs_conceded=payload.runsConceded, wickets=payload.wickets,
        maidens=payload.maidens, dot_balls=payload.dotBalls, wides=payload.wides, no_balls=payload.noBalls,
        catches=payload.catches, dropped_catches=payload.droppedCatches, run_outs=payload.runOuts,
        stumpings=payload.stumpings, misfields=payload.misfields, notes=payload.notes,
    )
    player_role = player.player_profile.player_role if player.player_profile else None
    _recompute_and_validate(mp, player_role)

    try:
        db.add(mp)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=DUPLICATE_MESSAGE)
    db.refresh(mp)
    return _out(mp, player.public_id, match.public_id)


@router.get("", response_model=List[MatchPerformanceOut])
def list_match_performance(db: Session = Depends(get_db), _=Depends(require_staff)):
    rows = db.query(MatchPerformance).order_by(MatchPerformance.id).all()
    return [_out(mp, mp.player.public_id, mp.match.public_id) for mp in rows]


@router.get("/player/{player_identifier}", response_model=List[MatchPerformanceOut])
def list_match_performance_for_player(
    player_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    _authorize_view(current_user, player_identifier)
    player = _get_player_or_404(db, player_identifier)
    rows = db.query(MatchPerformance).filter(MatchPerformance.player_id == player.id).order_by(MatchPerformance.id).all()
    return [_out(mp, player.public_id, mp.match.public_id) for mp in rows]


@router.get("/{mp_id}", response_model=MatchPerformanceOut)
def get_match_performance(mp_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mp = _get_mp_or_404(db, mp_id)
    _authorize_view(current_user, mp.player.public_id)
    return _out(mp, mp.player.public_id, mp.match.public_id)


@router.put("/{mp_id}", response_model=MatchPerformanceOut)
def update_match_performance(mp_id: str, payload: MatchPerformanceUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    mp = _get_mp_or_404(db, mp_id)
    data = payload.model_dump(exclude_unset=True)

    field_map = {
        "battingPosition": "batting_position", "runs": "runs", "ballsFaced": "balls_faced",
        "dismissalType": "dismissal_type", "fours": "fours", "sixes": "sixes",
        "oversBowled": "overs_bowled", "runsConceded": "runs_conceded", "wickets": "wickets",
        "maidens": "maidens", "dotBalls": "dot_balls", "wides": "wides", "noBalls": "no_balls",
        "catches": "catches", "droppedCatches": "dropped_catches", "runOuts": "run_outs",
        "stumpings": "stumpings", "misfields": "misfields", "notes": "notes",
    }
    for payload_key, column in field_map.items():
        if payload_key in data:
            setattr(mp, column, data[payload_key])

    player_role = mp.player.player_profile.player_role if mp.player.player_profile else None
    _recompute_and_validate(mp, player_role)
    db.commit()
    db.refresh(mp)
    return _out(mp, mp.player.public_id, mp.match.public_id)


@router.delete("/{mp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_match_performance(mp_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    mp = _get_mp_or_404(db, mp_id)
    # Removes ONLY this performance record — the Player, Match, Tournament
    # and Schedule rows it references are never touched here.
    db.delete(mp)
    db.commit()
