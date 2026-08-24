"""GET /api/admin/dashboard — real counts backing Dashboard.jsx's existing StatCards
and tables. No new cards, no new metrics beyond what the page already shows.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Tournament
from ..schemas import DashboardOut, RecentUserOut, TournamentOut
from ..auth import require_admin

router = APIRouter(prefix="/admin/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(func.count(User.id)).scalar()
    active_coaches = db.query(func.count(User.id)).filter(User.role == "COACH", User.is_active.is_(True)).scalar()
    active_players = db.query(func.count(User.id)).filter(User.role == "PLAYER", User.is_active.is_(True)).scalar()
    ongoing_tournaments = db.query(func.count(Tournament.id)).filter(Tournament.status == "Ongoing").scalar()

    recent_users = db.query(User).order_by(User.id.desc()).limit(5).all()
    tournaments = db.query(Tournament).order_by(Tournament.id).all()

    return DashboardOut(
        totalUsers=total_users or 0,
        activeCoaches=active_coaches or 0,
        activePlayers=active_players or 0,
        ongoingTournaments=ongoing_tournaments or 0,
        recentUsers=[
            RecentUserOut(id=u.public_id, name=u.full_name, username=u.username, role=u.role,
                          status="Active" if u.is_active else "Inactive")
            for u in recent_users
        ],
        tournaments=[
            TournamentOut(id=t.public_id, name=t.name, format=t.format, startDate=t.start_date,
                          endDate=t.end_date, teams=t.teams, status=t.status)
            for t in tournaments
        ],
    )
