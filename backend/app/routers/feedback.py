"""
Feedback — real MySQL persistence for:
  - Coach -> Player List detail modal's Feedback tab (create / view)
  - Player -> My Feedback (view OWN PLAYER_VISIBLE feedback only)
replacing the old frontend-only demo state in both pages.

Belongs to an EXISTING Player (`users`, role=PLAYER) — never a second
player table. A PRIVATE note is an internal Coach-only observation and
must NEVER be returned to a Player, even through the "my own records"
endpoint — enforced server-side below, not just hidden in the UI.

Authorization:
  - Coach (and Admin) can create / view (any, including PRIVATE) / edit.
  - Player can only VIEW their own PLAYER_VISIBLE feedback — never
    create/edit, never PRIVATE notes, and never another player's feedback
    even by guessing/changing a URL.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PlayerFeedback
from ..schemas import FeedbackCreate, FeedbackUpdate, FeedbackOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/feedback", tags=["feedback"])


def _get_player_or_404(db: Session, player_id: str) -> User:
    p = db.query(User).filter(User.public_id == player_id, User.role == "PLAYER").first()
    if p is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return p


def _get_feedback_or_404(db: Session, feedback_id: str) -> PlayerFeedback:
    f = db.query(PlayerFeedback).filter(PlayerFeedback.public_id == feedback_id).first()
    if f is None:
        raise HTTPException(status_code=404, detail="Feedback not found.")
    return f


def _authorize_view(current_user: User, target_player_public_id: str):
    if current_user.role in ("ADMIN", "COACH"):
        return
    if current_user.role == "PLAYER" and current_user.public_id == target_player_public_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own feedback.")


def _out(f: PlayerFeedback, player_public_id: str) -> FeedbackOut:
    return FeedbackOut(
        id=f.public_id, playerId=player_public_id, date=f.created_at.date(), text=f.text,
        strengths=f.strengths, areasToImprove=f.areas_to_improve, visibility=f.visibility,
        coachName=f.coach.full_name if f.coach else None,
    )


@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    player = _get_player_or_404(db, payload.playerId)
    f = PlayerFeedback(
        public_id=next_public_id(db, "FB", model=PlayerFeedback),
        player_id=player.id, coach_id=current_user.id if current_user.role == "COACH" else None,
        text=payload.text, strengths=payload.strengths, areas_to_improve=payload.areasToImprove,
        visibility=payload.visibility,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return _out(f, player.public_id)


@router.get("", response_model=List[FeedbackOut])
def list_feedback(db: Session = Depends(get_db), _=Depends(require_staff)):
    rows = db.query(PlayerFeedback).order_by(PlayerFeedback.id).all()
    return [_out(f, f.player.public_id) for f in rows]


@router.get("/player/{player_identifier}", response_model=List[FeedbackOut])
def list_feedback_for_player(
    player_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    _authorize_view(current_user, player_identifier)
    player = _get_player_or_404(db, player_identifier)
    q = db.query(PlayerFeedback).filter(PlayerFeedback.player_id == player.id)
    if current_user.role == "PLAYER":
        # A Player never sees a PRIVATE (internal coach-only) note, even
        # among their own records.
        q = q.filter(PlayerFeedback.visibility == "PLAYER_VISIBLE")
    rows = q.order_by(PlayerFeedback.id).all()
    return [_out(f, player.public_id) for f in rows]


@router.get("/{feedback_id}", response_model=FeedbackOut)
def get_feedback(feedback_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = _get_feedback_or_404(db, feedback_id)
    _authorize_view(current_user, f.player.public_id)
    if current_user.role == "PLAYER" and f.visibility != "PLAYER_VISIBLE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own feedback.")
    return _out(f, f.player.public_id)


@router.put("/{feedback_id}", response_model=FeedbackOut)
def update_feedback(feedback_id: str, payload: FeedbackUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    f = _get_feedback_or_404(db, feedback_id)
    data = payload.model_dump(exclude_unset=True)
    field_map = {
        "text": "text", "strengths": "strengths", "areasToImprove": "areas_to_improve", "visibility": "visibility",
    }
    for payload_key, column in field_map.items():
        if payload_key in data:
            setattr(f, column, data[payload_key])
    db.commit()
    db.refresh(f)
    return _out(f, f.player.public_id)


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(feedback_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    f = _get_feedback_or_404(db, feedback_id)
    db.delete(f)
    db.commit()
