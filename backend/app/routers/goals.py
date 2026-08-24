"""
Goals — real MySQL persistence for:
  - Coach -> Goal Tracking (create / view / edit; existing UI already has
    no delete action, so none is added here)
  - Player -> My Goals (view OWN goals only)
replacing the old frontend-only demo state in both pages.

Belongs to an EXISTING Player (`users`, role=PLAYER) — never a second
player table. A Goal is a short-term target with a deadline; see
development_plans.py for the separate, longer-term Development Plan
concept the existing UI already treats independently.

Authorization:
  - Coach (and Admin) can create / view (any) / edit.
  - Player can only VIEW their own goals — never create/edit, and never
    another player's goals even by guessing/changing a URL.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PlayerGoal
from ..schemas import GoalCreate, GoalUpdate, GoalOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/goals", tags=["goals"])


def _get_player_or_404(db: Session, player_id: str) -> User:
    p = db.query(User).filter(User.public_id == player_id, User.role == "PLAYER").first()
    if p is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return p


def _get_goal_or_404(db: Session, goal_id: str) -> PlayerGoal:
    g = db.query(PlayerGoal).filter(PlayerGoal.public_id == goal_id).first()
    if g is None:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return g


def _authorize_view(current_user: User, target_player_public_id: str):
    if current_user.role in ("ADMIN", "COACH"):
        return
    if current_user.role == "PLAYER" and current_user.public_id == target_player_public_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own goals.")


def _out(g: PlayerGoal, player_public_id: str) -> GoalOut:
    return GoalOut(
        id=g.public_id, playerId=player_public_id, focusArea=g.focus_area, target=g.target,
        deadline=g.deadline, progressPct=g.progress_pct, status=g.status,
    )


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    player = _get_player_or_404(db, payload.playerId)
    g = PlayerGoal(
        public_id=next_public_id(db, "G", model=PlayerGoal),
        player_id=player.id, coach_id=current_user.id if current_user.role == "COACH" else None,
        focus_area=payload.focusArea, target=payload.target, deadline=payload.deadline,
        progress_pct=payload.progressPct, status=payload.status,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return _out(g, player.public_id)


@router.get("", response_model=List[GoalOut])
def list_goals(db: Session = Depends(get_db), _=Depends(require_staff)):
    rows = db.query(PlayerGoal).order_by(PlayerGoal.id).all()
    return [_out(g, g.player.public_id) for g in rows]


@router.get("/player/{player_identifier}", response_model=List[GoalOut])
def list_goals_for_player(
    player_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    _authorize_view(current_user, player_identifier)
    player = _get_player_or_404(db, player_identifier)
    rows = db.query(PlayerGoal).filter(PlayerGoal.player_id == player.id).order_by(PlayerGoal.id).all()
    return [_out(g, player.public_id) for g in rows]


@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(goal_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    g = _get_goal_or_404(db, goal_id)
    _authorize_view(current_user, g.player.public_id)
    return _out(g, g.player.public_id)


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: str, payload: GoalUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    g = _get_goal_or_404(db, goal_id)
    data = payload.model_dump(exclude_unset=True)
    field_map = {
        "focusArea": "focus_area", "target": "target", "deadline": "deadline",
        "progressPct": "progress_pct", "status": "status",
    }
    for payload_key, column in field_map.items():
        if payload_key in data:
            setattr(g, column, data[payload_key])
    db.commit()
    db.refresh(g)
    return _out(g, g.player.public_id)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    g = _get_goal_or_404(db, goal_id)
    db.delete(g)
    db.commit()
