"""
Player Directory — a READ-ONLY player list shared by Coach-facing pages
(Coach -> Player List, Match Entry, Training Entry). Admin -> Player
Management keeps its own full CRUD at /admin/players (Admin-only,
players.py); this router is the separate, read-only view Admin and Coach
both use so Coach's record-entry pages can look up existing MySQL player
profiles without ever being able to create or edit player identity data
themselves — that stays Admin's job.

GET /api/players               -> every player, any status (Coach Player List)
GET /api/players?status=Active -> ACTIVE players only (Match Entry / Training
                                   Entry dropdowns — only active players
                                   should normally show up there)

A logged-in PLAYER hitting this same endpoint gets back a single-item list
containing ONLY their own profile — used by Player -> My Match Stats / My
Training Records to read their own age/role/batting/bowling style without
a separate "player profile" endpoint. A Player can never see anyone else's
identity data through this route.

Every field it returns (id, name, age, role, battingStyle, bowlingStyle,
heightCm, weightKg, status) is the exact same `users` + `player_profiles`
JOIN Admin -> Player Management reads — never a separate copy.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import User
from ..schemas import PlayerOut
from ..auth import get_current_user

router = APIRouter(prefix="/players", tags=["player-directory"])


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
def list_players(
    status: Optional[str] = Query(None, description="Filter to 'Active' or 'Inactive'. Omit for all."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "PLAYER":
        # A Player only ever sees their OWN profile through this endpoint —
        # the `status` filter is Coach/Admin-only and ignored here.
        q = db.query(User).filter(User.id == current_user.id, User.role == "PLAYER")
    else:
        q = db.query(User).filter(User.role == "PLAYER")
        if status:
            q = q.filter(User.is_active == (status.strip().lower() == "active"))
    return [_to_out(u) for u in q.order_by(User.id).all()]
