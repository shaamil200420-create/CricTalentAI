"""Coach Management — GET/POST/PUT/PATCH backing CoachManagement.jsx. Admin-only.

Only the account fields Admin's Coach Management page itself manages
(Add/View/Edit/Activate/Deactivate/Change-password) are handled here. The
page's "Assigned Players" checkbox list is a separate, frontend-local
feature not named in this task's scope and is left untouched.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import CoachCreate, CoachUpdate, CoachOut, StatusUpdate, PasswordUpdate
from ..auth import require_admin, hash_password, next_public_id

router = APIRouter(prefix="/admin/coaches", tags=["coaches"])


def _to_out(u: User) -> CoachOut:
    return CoachOut(
        id=u.public_id, name=u.full_name, username=u.username, phone=u.phone,
        specialization=u.specialization, since=u.created_at.date() if u.created_at else None,
        status="Active" if u.is_active else "Inactive",
    )


@router.get("", response_model=List[CoachOut])
def list_coaches(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(User).filter(User.role == "COACH").order_by(User.id).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=CoachOut, status_code=status.HTTP_201_CREATED)
def create_coach(payload: CoachCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")
    user = User(
        public_id=next_public_id(db, "C"),
        full_name=payload.name, username=payload.username, phone=payload.phone,
        specialization=payload.specialization, password_hash=hash_password(payload.password),
        role="COACH", is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user)


def _get_coach_or_404(db: Session, coach_id: str) -> User:
    user = db.query(User).filter(User.public_id == coach_id, User.role == "COACH").first()
    if user is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return user


@router.get("/{coach_id}", response_model=CoachOut)
def get_coach(coach_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return _to_out(_get_coach_or_404(db, coach_id))


@router.put("/{coach_id}", response_model=CoachOut)
def update_coach(coach_id: str, payload: CoachUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_coach_or_404(db, coach_id)
    if payload.name is not None:
        user.full_name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.specialization is not None:
        user.specialization = payload.specialization
    if payload.status is not None:
        user.is_active = payload.status == "Active"
    if payload.newPassword:
        user.password_hash = hash_password(payload.newPassword)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.patch("/{coach_id}/status", response_model=CoachOut)
def set_coach_status(coach_id: str, payload: StatusUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_coach_or_404(db, coach_id)
    user.is_active = payload.status == "Active"
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.patch("/{coach_id}/password", response_model=CoachOut)
def set_coach_password(coach_id: str, payload: PasswordUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_coach_or_404(db, coach_id)
    user.password_hash = hash_password(payload.newPassword)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.delete("/{coach_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coach(coach_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_coach_or_404(db, coach_id)
    db.delete(user)
    db.commit()
