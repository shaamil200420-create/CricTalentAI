"""Player Management — GET/POST/PUT/PATCH backing PlayerManagement.jsx. Admin-only.

Each Player is one `users` row (role=PLAYER, login credentials) plus one
`player_profiles` row (cricket info) created together on Add and kept in
sync on Edit.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, PlayerProfile
from ..schemas import PlayerCreate, PlayerUpdate, PlayerOut, StatusUpdate, PasswordUpdate
from ..auth import require_admin, hash_password, next_public_id

router = APIRouter(prefix="/admin/players", tags=["players"])


def _to_out(u: User) -> PlayerOut:
    p = u.player_profile
    return PlayerOut(
        id=u.public_id, username=u.username, name=u.full_name,
        age=p.age if p else None, role=p.player_role if p else None,
        battingStyle=p.batting_style if p else None, bowlingStyle=p.bowling_style if p else None,
        heightCm=p.height_cm if p else None, weightKg=p.weight_kg if p else None,
        status="Active" if u.is_active else "Inactive",
    )


@router.get("", response_model=List[PlayerOut])
def list_players(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = db.query(User).filter(User.role == "PLAYER").order_by(User.id).all()
    return [_to_out(r) for r in rows]


@router.post("", response_model=PlayerOut, status_code=status.HTTP_201_CREATED)
def create_player(payload: PlayerCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")
    public_id = next_public_id(db, "P")
    user = User(
        public_id=public_id, full_name=payload.name, username=payload.username,
        password_hash=hash_password(payload.password), role="PLAYER", is_active=True,
    )
    db.add(user)
    db.flush()  # get user.id before creating the profile row
    profile = PlayerProfile(
        user_id=user.id, age=payload.age, player_role=payload.role,
        batting_style=payload.battingStyle, bowling_style=payload.bowlingStyle,
        height_cm=payload.heightCm, weight_kg=payload.weightKg,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return _to_out(user)


def _get_player_or_404(db: Session, player_id: str) -> User:
    user = db.query(User).filter(User.public_id == player_id, User.role == "PLAYER").first()
    if user is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return user


@router.get("/{player_id}", response_model=PlayerOut)
def get_player(player_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    return _to_out(_get_player_or_404(db, player_id))


@router.put("/{player_id}", response_model=PlayerOut)
def update_player(player_id: str, payload: PlayerUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_player_or_404(db, player_id)
    if payload.name is not None:
        user.full_name = payload.name
    if payload.status is not None:
        user.is_active = payload.status == "Active"
    if payload.newPassword:
        user.password_hash = hash_password(payload.newPassword)

    profile = user.player_profile
    if profile is None:
        profile = PlayerProfile(user_id=user.id)
        db.add(profile)
    if payload.age is not None:
        profile.age = payload.age
    if payload.role is not None:
        profile.player_role = payload.role
    if payload.battingStyle is not None:
        profile.batting_style = payload.battingStyle
    if payload.bowlingStyle is not None:
        profile.bowling_style = payload.bowlingStyle
    if payload.heightCm is not None:
        profile.height_cm = payload.heightCm
    if payload.weightKg is not None:
        profile.weight_kg = payload.weightKg

    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.patch("/{player_id}/status", response_model=PlayerOut)
def set_player_status(player_id: str, payload: StatusUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_player_or_404(db, player_id)
    user.is_active = payload.status == "Active"
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.patch("/{player_id}/password", response_model=PlayerOut)
def set_player_password(player_id: str, payload: PasswordUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_player_or_404(db, player_id)
    user.password_hash = hash_password(payload.newPassword)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(player_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = _get_player_or_404(db, player_id)
    db.delete(user)  # cascades to player_profiles via the User.player_profile relationship
    db.commit()
