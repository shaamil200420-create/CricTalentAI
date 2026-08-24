"""
Database connection setup.

Reads WAMP MySQL connection details from .env (see .env.example). If you
run WAMP with different settings (a different port, a MySQL password you
set yourself, etc.), just edit the DB_* values in backend/.env — nothing
else in this project needs to change.

Environment loading itself lives in .config, not here — this file stays
focused on the database connection/session logic only. Importing .config
first (below) guarantees .env / .env.gemini are loaded before the
os.getenv() calls just after it, regardless of what else imports this
module first.
"""
import os
from . import config  # noqa: F401  (loads backend/.env + backend/.env.gemini)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "crictalentai_db")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# pool_pre_ping avoids "MySQL server has gone away" errors after WAMP's
# MySQL has been idle for a while.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — one DB session per request, always closed after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
