"""
Environment configuration — the ONE place in this backend that loads
environment files. Import this module (or anything that already imports
it) before reading any environment variable — DB_HOST, DB_PORT, DB_USER,
DB_PASSWORD, DB_NAME, JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES,
CORS_ORIGINS, GEMINI_API_KEY, etc. — so load order is guaranteed no
matter which module happens to be imported first.

Loads two files, both resolved relative to THIS file's own location
(backend/app/config.py -> backend/), never the process's current working
directory, so it behaves the same whether uvicorn is started from
backend/ or anywhere else:

  1. backend/.env         — normal backend settings (DB_*, JWT_*, CORS_*)
  2. backend/.env.gemini   — ONLY the Gemini API key, kept in a separate
                             file on purpose (see backend/.env.gemini.example)

Gemini is OPTIONAL. backend/.env.gemini may be missing, blank, or
invalid — load_dotenv() silently does nothing if the file isn't there
and never raises, so this module can never prevent FastAPI from
starting. MySQL, JWT/login, Match Entry, Training Records, the Player
Portal, and ML have no dependency on Gemini being configured, now or
later. Nothing in this file ever reads, prints, or logs a secret value —
it only loads them into the process environment for os.getenv() to read
elsewhere.
"""
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env.gemini")
