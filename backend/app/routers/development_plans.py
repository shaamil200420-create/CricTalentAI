"""
Development Plans — real MySQL persistence for:
  - Coach -> Development Plan (create / view / edit)
  - Player -> My Development Report (view OWN plan only)
replacing the old frontend-only demo state in both pages.

Belongs to an EXISTING Player (`users`, role=PLAYER) — never a second
player table. Distinct from Goals (goals.py): a Development Plan is a
longer-term objective with a start/target date range and free-text notes,
matching the existing Coach -> Development Plan UI exactly.

Authorization:
  - Coach (and Admin) can create / view (any) / edit.
  - Player can only VIEW their own plan(s) — never create/edit, and never
    another player's plan even by guessing/changing a URL.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PlayerDevelopmentPlan
from ..schemas import DevelopmentPlanCreate, DevelopmentPlanUpdate, DevelopmentPlanOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/development-plans", tags=["development-plans"])


def _get_player_or_404(db: Session, player_id: str) -> User:
    p = db.query(User).filter(User.public_id == player_id, User.role == "PLAYER").first()
    if p is None:
        raise HTTPException(status_code=404, detail="Player not found.")
    return p


def _get_plan_or_404(db: Session, plan_id: str) -> PlayerDevelopmentPlan:
    p = db.query(PlayerDevelopmentPlan).filter(PlayerDevelopmentPlan.public_id == plan_id).first()
    if p is None:
        raise HTTPException(status_code=404, detail="Development plan not found.")
    return p


def _authorize_view(current_user: User, target_player_public_id: str):
    if current_user.role in ("ADMIN", "COACH"):
        return
    if current_user.role == "PLAYER" and current_user.public_id == target_player_public_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own development plan.")


def _out(p: PlayerDevelopmentPlan, player_public_id: str) -> DevelopmentPlanOut:
    return DevelopmentPlanOut(
        id=p.public_id, playerId=player_public_id, focusArea=p.focus_area, objective=p.objective,
        startDate=p.start_date, targetDate=p.target_date, progressPct=p.progress_pct,
        status=p.status, notes=p.notes,
    )


@router.post("", response_model=DevelopmentPlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(payload: DevelopmentPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    player = _get_player_or_404(db, payload.playerId)
    p = PlayerDevelopmentPlan(
        public_id=next_public_id(db, "DP", model=PlayerDevelopmentPlan),
        player_id=player.id, coach_id=current_user.id if current_user.role == "COACH" else None,
        focus_area=payload.focusArea, objective=payload.objective,
        start_date=payload.startDate, target_date=payload.targetDate,
        progress_pct=payload.progressPct, status=payload.status, notes=payload.notes,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _out(p, player.public_id)


@router.get("", response_model=List[DevelopmentPlanOut])
def list_plans(db: Session = Depends(get_db), _=Depends(require_staff)):
    rows = db.query(PlayerDevelopmentPlan).order_by(PlayerDevelopmentPlan.id).all()
    return [_out(p, p.player.public_id) for p in rows]


@router.get("/player/{player_identifier}", response_model=List[DevelopmentPlanOut])
def list_plans_for_player(
    player_identifier: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    _authorize_view(current_user, player_identifier)
    player = _get_player_or_404(db, player_identifier)
    rows = db.query(PlayerDevelopmentPlan).filter(PlayerDevelopmentPlan.player_id == player.id).order_by(PlayerDevelopmentPlan.id).all()
    return [_out(p, player.public_id) for p in rows]


@router.get("/{plan_id}", response_model=DevelopmentPlanOut)
def get_plan(plan_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = _get_plan_or_404(db, plan_id)
    _authorize_view(current_user, p.player.public_id)
    return _out(p, p.player.public_id)


@router.put("/{plan_id}", response_model=DevelopmentPlanOut)
def update_plan(plan_id: str, payload: DevelopmentPlanUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    p = _get_plan_or_404(db, plan_id)
    data = payload.model_dump(exclude_unset=True)
    field_map = {
        "focusArea": "focus_area", "objective": "objective", "startDate": "start_date",
        "targetDate": "target_date", "progressPct": "progress_pct", "status": "status", "notes": "notes",
    }
    for payload_key, column in field_map.items():
        if payload_key in data:
            setattr(p, column, data[payload_key])
    db.commit()
    db.refresh(p)
    return _out(p, p.player.public_id)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    p = _get_plan_or_404(db, plan_id)
    db.delete(p)
    db.commit()
