"""
Training Records — real MySQL persistence for:
  - Coach -> Training Entry (create)
  - Player -> My Training Records (view OWN records only)
replacing Training Entry's old temporary React-state-only "Saved This
Session" table, which is no longer the source of truth (it never
persisted past the current page view at all).

Belongs to an EXISTING Player (`users`, role=PLAYER) and an EXISTING
Training Schedule (`schedules`, kind='Training' — the same shared
scheduling table Admin/Coach Schedule Management already use, never a
second training-session system). Exactly one row may exist per (player,
training session) pair.

Authorization:
  - Coach (and Admin) can create / view (any) / edit / remove.
  - Player can only VIEW their own records — no create/edit/delete, and
    never another player's records even by guessing/changing a URL.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import User, Schedule, TrainingRecord
from ..schemas import TrainingRecordCreate, TrainingRecordUpdate, TrainingRecordOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/training-records", tags=["training-records"])

DUPLICATE_MESSAGE = (
    "A training record already exists for this player and session. "
    "Coach should edit the existing record instead."
)


def _get_player_or_404(db: Session, player_id: str) -> User:
    p = db.query(User).filter(User.public_id == player_id, User.role == "PLAYER").first()
    if p is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return p


def _get_session_or_404(db: Session, session_id: str) -> Schedule:
    s = db.query(Schedule).filter(Schedule.public_id == session_id, Schedule.kind == "Training").first()
    if s is None:
        raise HTTPException(status_code=404, detail="Training session not found.")
    return s


def _get_tr_or_404(db: Session, tr_id: str) -> TrainingRecord:
    tr = db.query(TrainingRecord).filter(TrainingRecord.public_id == tr_id).first()
    if tr is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return tr


def _authorize_view(current_user: User, target_player_public_id: str):
    if current_user.role in ("ADMIN", "COACH"):
        return
    if current_user.role == "PLAYER" and current_user.public_id == target_player_public_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own records.")


def _out(tr: TrainingRecord, player_public_id: str, session_public_id: str) -> TrainingRecordOut:
    return TrainingRecordOut(
        id=tr.public_id, playerId=player_public_id, sessionId=session_public_id,
        attendance=tr.attendance, drillsAssigned=tr.drills_assigned, drillsCompleted=tr.drills_completed,
        battingPractice=tr.batting_practice, bowlingPractice=tr.bowling_practice,
        fieldingScore=tr.fielding_score, fitnessScore=tr.fitness_score,
        coachRating=tr.coach_rating, notes=tr.notes,
    )


def _apply_absent_rule(tr: TrainingRecord):
    """
    When Absent, the practice/fitness/rating figures are not-applicable —
    matches the existing mock precedent (mockData.js's TRAINING_RECORDS_P001
    already nulls these on its one Absent row). drills_assigned/completed
    and notes are left exactly as given either way.
    """
    if tr.attendance == "Absent":
        tr.batting_practice = None
        tr.bowling_practice = None
        tr.fielding_score = None
        tr.fitness_score = None
        tr.coach_rating = None


@router.post("", response_model=TrainingRecordOut, status_code=status.HTTP_201_CREATED)
def create_training_record(payload: TrainingRecordCreate, db: Session = Depends(get_db), _=Depends(require_staff)):
    player = _get_player_or_404(db, payload.playerId)
    session = _get_session_or_404(db, payload.sessionId)

    existing = db.query(TrainingRecord).filter(
        TrainingRecord.player_id == player.id, TrainingRecord.schedule_id == session.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=DUPLICATE_MESSAGE)

    tr = TrainingRecord(
        public_id=next_public_id(db, "TC", model=TrainingRecord),
        player_id=player.id, schedule_id=session.id,
        attendance=payload.attendance, drills_assigned=payload.drillsAssigned, drills_completed=payload.drillsCompleted,
        batting_practice=payload.battingPractice, bowling_practice=payload.bowlingPractice,
        fielding_score=payload.fieldingScore, fitness_score=payload.fitnessScore,
        coach_rating=payload.coachRating, notes=payload.notes,
    )
    _apply_absent_rule(tr)

    try:
        db.add(tr)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=DUPLICATE_MESSAGE)
    db.refresh(tr)
    return _out(tr, player.public_id, session.public_id)


@router.get("", response_model=List[TrainingRecordOut])
def list_training_records(db: Session = Depends(get_db), _=Depends(require_staff)):
    rows = db.query(TrainingRecord).order_by(TrainingRecord.id).all()
    return [_out(tr, tr.player.public_id, tr.schedule.public_id) for tr in rows]


@router.get("/player/{player_identifier}", response_model=List[TrainingRecordOut])
def list_training_records_for_player(
    player_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    _authorize_view(current_user, player_identifier)
    player = _get_player_or_404(db, player_identifier)
    rows = db.query(TrainingRecord).filter(TrainingRecord.player_id == player.id).order_by(TrainingRecord.id).all()
    return [_out(tr, player.public_id, tr.schedule.public_id) for tr in rows]


@router.get("/session/{session_identifier}", response_model=List[TrainingRecordOut])
def list_training_records_for_session(session_identifier: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    session = _get_session_or_404(db, session_identifier)
    rows = db.query(TrainingRecord).filter(TrainingRecord.schedule_id == session.id).order_by(TrainingRecord.id).all()
    return [_out(tr, tr.player.public_id, session.public_id) for tr in rows]


@router.get("/{tr_id}", response_model=TrainingRecordOut)
def get_training_record(tr_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tr = _get_tr_or_404(db, tr_id)
    _authorize_view(current_user, tr.player.public_id)
    return _out(tr, tr.player.public_id, tr.schedule.public_id)


@router.put("/{tr_id}", response_model=TrainingRecordOut)
def update_training_record(tr_id: str, payload: TrainingRecordUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    tr = _get_tr_or_404(db, tr_id)
    data = payload.model_dump(exclude_unset=True)

    field_map = {
        "attendance": "attendance", "drillsAssigned": "drills_assigned", "drillsCompleted": "drills_completed",
        "battingPractice": "batting_practice", "bowlingPractice": "bowling_practice",
        "fieldingScore": "fielding_score", "fitnessScore": "fitness_score",
        "coachRating": "coach_rating", "notes": "notes",
    }
    for payload_key, column in field_map.items():
        if payload_key in data:
            setattr(tr, column, data[payload_key])
    _apply_absent_rule(tr)

    db.commit()
    db.refresh(tr)
    return _out(tr, tr.player.public_id, tr.schedule.public_id)


@router.delete("/{tr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_record(tr_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    tr = _get_tr_or_404(db, tr_id)
    db.delete(tr)
    db.commit()
