"""
Creates the very first Admin account, if none exists yet.

Usage (from the backend/ folder, with your virtualenv/deps active):

    python seed_admin.py

The password is never hard-coded here — it is read from the
SEED_ADMIN_PASSWORD environment variable if set, otherwise you'll be
prompted for it (typed input is hidden). Username/name/email can also be
overridden via SEED_ADMIN_USERNAME / SEED_ADMIN_NAME / SEED_ADMIN_EMAIL,
but sensible defaults are used if you just want to get started quickly.
"""
import os
import getpass

from app.database import SessionLocal, Base, engine
from app.models import User
from app.auth import hash_password, next_public_id


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "ADMIN").first():
            print("An Admin account already exists — nothing to do.")
            return

        username = os.getenv("SEED_ADMIN_USERNAME", "admin")
        name = os.getenv("SEED_ADMIN_NAME", "Admin User")
        email = os.getenv("SEED_ADMIN_EMAIL") or None
        password = os.getenv("SEED_ADMIN_PASSWORD")
        if not password:
            password = getpass.getpass(f"Set a password for the first Admin account ('{username}'): ")
        if not password:
            print("No password provided — aborting.")
            return

        user = User(
            public_id=next_public_id(db, "A"),
            full_name=name, username=username, email=email,
            password_hash=hash_password(password), role="ADMIN", is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Created Admin account '{username}' (id {user.public_id}). You can now log in with this username and the password you just set.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
