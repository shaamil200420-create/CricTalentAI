"""POST /api/auth/login and GET /api/auth/me."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, CurrentUser
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive.")
    token = create_access_token(user)
    return LoginResponse(token=token, role=user.role, id=user.public_id, name=user.full_name, username=user.username)


@router.get("/me", response_model=CurrentUser)
def me(current_user: User = Depends(get_current_user)):
    return CurrentUser(
        id=current_user.public_id,
        name=current_user.full_name,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        status="Active" if current_user.is_active else "Inactive",
    )
