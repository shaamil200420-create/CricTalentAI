"""
FastAPI application entrypoint.

Run with:  python -m uvicorn app.main:app --reload   (from the backend/ folder)
Swagger UI then lives at http://127.0.0.1:8000/docs

Creates tables on startup if they don't exist yet (Base.metadata.create_all
— never drops anything, never touches existing data) and exposes a real
GET /api/health check that only reports "connected" after a MySQL query
actually succeeds.
"""
import os
from . import config  # noqa: F401  (loads backend/.env + backend/.env.gemini — must run before os.getenv() below)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, inspect

from .database import engine, Base, SessionLocal
from .routers import (
    auth, admins, coaches, players, player_directory, tournaments, matches, schedules, dashboard,
    match_performance, training_records, goals, development_plans, feedback,
)

# Import models so their tables are registered on Base before create_all runs.
from . import models  # noqa: F401
from .models import User
from .auth import hash_password, next_public_id

app = FastAPI(title="CricTalentAI Admin Backend")

cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"


def _ensure_column(table_name: str, column_name: str, ddl_type: str):
    """
    Tiny startup migration helper: Base.metadata.create_all() only creates
    tables that don't exist yet — it never adds a new column to a table
    that's already there. The shared-scheduling update adds matches.time
    and schedules.training_type, so this checks each table (if it already
    exists from before) and ALTERs it in place when the column is missing.
    Safe to run every startup: it's a no-op once the column exists.
    """
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return  # brand new table — create_all() above already made it correctly
    existing_columns = [c["name"] for c in inspector.get_columns(table_name)]
    if column_name not in existing_columns:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_type} NULL"))
        print(f"Migrated: added {table_name}.{column_name} column.")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _ensure_column("matches", "time", "TIME")
    _ensure_column("schedules", "training_type", "VARCHAR(20)")

    # First-run convenience: if there is no Admin account yet at all, create
    # one automatically with a known username/password instead of requiring
    # a separate seed_admin.py run. This only ever fires when the `users`
    # table has zero ADMIN rows — it never touches or resets an existing
    # account, so once you've set your own password this stops running.
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.role == "ADMIN").first():
            admin = User(
                public_id=next_public_id(db, "A"),
                full_name="Admin User",
                username=DEFAULT_ADMIN_USERNAME,
                password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
                role="ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("=" * 60)
            print(f"No Admin account found — created a default one:")
            print(f"  username: {DEFAULT_ADMIN_USERNAME}")
            print(f"  password: {DEFAULT_ADMIN_PASSWORD}")
            print("Log in with these, then change the password from the")
            print("Admin Management page.")
            print("=" * 60)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        finally:
            db.close()
    except Exception as exc:
        return {"status": "error", "database": f"disconnected: {exc}"}


app.include_router(auth.router, prefix="/api")
app.include_router(admins.router, prefix="/api")
app.include_router(coaches.router, prefix="/api")
app.include_router(players.router, prefix="/api")
app.include_router(player_directory.router, prefix="/api")
app.include_router(tournaments.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")
app.include_router(match_performance.router, prefix="/api")
app.include_router(training_records.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(development_plans.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
