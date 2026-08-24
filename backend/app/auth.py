"""
Password hashing, JWT issuing/verification, and the two FastAPI
dependencies every protected route uses: get_current_user (any logged-in
user) and require_admin (Admin-only routes).

Also home to next_public_id(), the tiny helper that keeps generating
display IDs in the existing P001/C001/A001 style instead of switching to
random UUIDs.
"""
import os
from . import config  # noqa: F401  (loads backend/.env + backend/.env.gemini — must run before os.getenv() below)
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import get_db
from .models import User

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "public_id": user.public_id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    payload = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """
    Admin OR Coach — used by the shared Match/Training schedule endpoints,
    where both roles have identical View/Create/Edit/Cancel/Delete
    permissions. Player is read-only there (GET routes just require any
    logged-in user via get_current_user, no require_staff).
    """
    if current_user.role not in ("ADMIN", "COACH"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Coach access required.")
    return current_user


def next_public_id(db: Session, prefix: str, model=User, column_name: str = "public_id") -> str:
    """
    Returns the next display ID for a given prefix, e.g. next_public_id(db,
    "P") -> "P004" if P001-P003 already exist. Scans existing IDs with this
    prefix on the given model/column rather than relying on row count, so
    a deactivated/edited-away record never causes a collision.
    """
    column = getattr(model, column_name)
    existing = db.query(column).filter(column.like(f"{prefix}%")).all()
    max_n = 0
    for (value,) in existing:
        digits = value[len(prefix):]
        if digits.isdigit():
            max_n = max(max_n, int(digits))
    return f"{prefix}{max_n + 1:03d}"
