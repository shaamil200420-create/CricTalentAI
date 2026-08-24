"""Admin Management — GET/POST/PUT/PATCH backing AdminManagement.jsx. Admin-only."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import AdminCreate, AdminUpdate, AdminOut, StatusUpdate, PasswordUpdate
from ..auth import require_admin, hash_password, next_public_id

router = APIRouter(prefix="/admin/admins", tags=["admins"])


def _to_out(u: User) -> AdminOut:
    return AdminOut(
        id=u.public_id, name=u.full_name, username=u.username, email=u.email,
        phone=u.phone, since=u.created_at.date() if u.created_at else None,
        status="Active" if u.is_active else "Inactive",
    )


@router.get("", response_model=List[AdminOut])
def list_admins(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(User).filter(User.role == "ADMIN").order_by(User.id).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def create_admin(payload: AdminCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")
    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists.")
    user = User(
        public_id=next_public_id(db, "A"),
        full_name=payload.name, username=payload.username, email=payload.email,
        phone=payload.phone, password_hash=hash_password(payload.password),
        role="ADMIN", is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user)


def _get_admin_or_404(db: Session, admin_id: str) -> User:
    user = db.query(User).filter(User.public_id == admin_id, User.role == "ADMIN").first()
    if user is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return user


@router.get("/{admin_id}", response_model=AdminOut)
def get_admin(admin_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return _to_out(_get_admin_or_404(db, admin_id))


@router.put("/{admin_id}", response_model=AdminOut)
def update_admin(admin_id: str, payload: AdminUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_admin_or_404(db, admin_id)
    if payload.email and payload.email != user.email:
        if db.query(User).filter(User.email == payload.email, User.id != user.id).first():
            raise HTTPException(status_code=400, detail="Email already exists.")
        user.email = payload.email
    if payload.name is not None:
        user.full_name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.status is not None:
        user.is_active = payload.status == "Active"
    if payload.newPassword:
        user.password_hash = hash_password(payload.newPassword)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.patch("/{admin_id}/status", response_model=AdminOut)
def set_admin_status(admin_id: str, payload: StatusUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_admin_or_404(db, admin_id)
    user.is_active = payload.status == "Active"
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.patch("/{admin_id}/password", response_model=AdminOut)
def set_admin_password(admin_id: str, payload: PasswordUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_admin_or_404(db, admin_id)
    user.password_hash = hash_password(payload.newPassword)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(admin_id: str, db: Session = Depends(get_db), current: User = Depends(require_admin)):
    user = _get_admin_or_404(db, admin_id)
    if user.id == current.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account while logged in.")
    remaining = db.query(User).filter(User.role == "ADMIN", User.id != user.id).count()
    if remaining == 0:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining Admin account.")
    db.delete(user)
    db.commit()
