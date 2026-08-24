"""
Seeds ~12 fictional Sri Lankan U19 demo players (login account +
player_profiles row, together) for the Coach record-entry demo (Match
Entry / Training Entry player dropdowns).

IDEMPOTENT: safe to run any number of times. Each player is looked up by
username first; if that username already exists, this script leaves it
completely untouched and moves on — it never creates a duplicate and
never overwrites an existing account. Public IDs (P00x) are assigned with
the same next_public_id() helper the real Admin -> Add Player form uses,
so this just continues whatever sequence already exists in your database
(P001, P002, ... — or later if some players already exist).

These are 100% FICTIONAL demo players for FYP/demo purposes only — no
real person's data.

Usage (from the backend/ folder, with your virtualenv/deps active):

    python seed_demo_players.py

The password every seeded player gets is read from SEED_PLAYER_PASSWORD
if set, otherwise it defaults to "player123" (the same demo password
already used elsewhere in this project, e.g. kasun.p001).
"""
import os

from app.database import SessionLocal, Base, engine
from app.models import User, PlayerProfile
from app.auth import hash_password, next_public_id

# name, age, role, battingStyle, bowlingStyle, heightCm, weightKg
# Roles deliberately mixed: 3 Batter, 4 Bowler, 3 All-Rounder, 2 Wicketkeeper-Batter.
DEMO_PLAYERS = [
    {"name": "Kasun Perera",          "age": 18, "role": "Batter",             "battingStyle": "Right-hand bat", "bowlingStyle": "Does not bowl",     "heightCm": 174, "weightKg": 66},
    {"name": "Nuwan Silva",           "age": 17, "role": "Bowler",             "battingStyle": "Right-hand bat", "bowlingStyle": "Right-arm fast",     "heightCm": 179, "weightKg": 70},
    {"name": "Dilan Fernando",        "age": 18, "role": "All-Rounder",        "battingStyle": "Left-hand bat",  "bowlingStyle": "Right-arm off-break", "heightCm": 171, "weightKg": 64},
    {"name": "Sahan Jayawardena",     "age": 16, "role": "Wicketkeeper-Batter","battingStyle": "Right-hand bat", "bowlingStyle": "Does not bowl",     "heightCm": 168, "weightKg": 60},
    {"name": "Chamod Wickramasinghe", "age": 18, "role": "Bowler",             "battingStyle": "Right-hand bat", "bowlingStyle": "Left-arm medium",    "heightCm": 182, "weightKg": 73},
    {"name": "Kavindu Gunasekara",    "age": 17, "role": "All-Rounder",        "battingStyle": "Right-hand bat", "bowlingStyle": "Right-arm leg-break", "heightCm": 170, "weightKg": 62},
    {"name": "Tharindu Madushan",     "age": 18, "role": "Batter",             "battingStyle": "Left-hand bat",  "bowlingStyle": "Does not bowl",     "heightCm": 176, "weightKg": 68},
    {"name": "Dineth Senanayake",     "age": 16, "role": "Wicketkeeper-Batter","battingStyle": "Right-hand bat", "bowlingStyle": "Does not bowl",     "heightCm": 165, "weightKg": 58},
    {"name": "Ravindu Bandara",       "age": 17, "role": "Bowler",             "battingStyle": "Right-hand bat", "bowlingStyle": "Right-arm fast",     "heightCm": 181, "weightKg": 71},
    {"name": "Akila Weerasinghe",     "age": 18, "role": "All-Rounder",        "battingStyle": "Left-hand bat",  "bowlingStyle": "Left-arm orthodox",  "heightCm": 173, "weightKg": 65},
    {"name": "Shenal Karunaratne",    "age": 16, "role": "Batter",             "battingStyle": "Right-hand bat", "bowlingStyle": "Does not bowl",     "heightCm": 169, "weightKg": 61},
    {"name": "Pasindu Rathnayake",    "age": 17, "role": "Bowler",             "battingStyle": "Right-hand bat", "bowlingStyle": "Right-arm medium",   "heightCm": 177, "weightKg": 69},
]


def _username_for(name: str, public_id_hint: int) -> str:
    # firstname.pXXX, e.g. "kasun.p001" — same scheme already used by the
    # one demo player that predates this script, kept for consistency.
    first = name.split(" ")[0].lower()
    return f"{first}.p{public_id_hint:03d}"


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    password = os.getenv("SEED_PLAYER_PASSWORD", "player123")

    created, skipped, backfilled = [], [], []
    try:
        for i, spec in enumerate(DEMO_PLAYERS, start=1):
            username = _username_for(spec["name"], i)
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                # Never touch an existing account/name/password — but if this
                # player's profile row is missing cricket details (e.g. an
                # earlier/partial seed only set age + role), safely fill in
                # ONLY the missing fields so the dropdown auto-fill has real
                # data for every demo player. Existing non-null values are
                # left exactly as they are.
                profile = db.query(PlayerProfile).filter(PlayerProfile.user_id == existing.id).first()
                filled_fields = []
                if profile:
                    field_map = {
                        "age": spec["age"], "player_role": spec["role"],
                        "batting_style": spec["battingStyle"], "bowling_style": spec["bowlingStyle"],
                        "height_cm": spec["heightCm"], "weight_kg": spec["weightKg"],
                    }
                    for col, value in field_map.items():
                        if getattr(profile, col) in (None, ""):
                            setattr(profile, col, value)
                            filled_fields.append(col)
                    if filled_fields:
                        db.commit()
                        backfilled.append((existing.public_id, spec["name"], filled_fields))
                skipped.append((existing.public_id, spec["name"], username))
                continue

            public_id = next_public_id(db, "P")
            user = User(
                public_id=public_id, full_name=spec["name"], username=username,
                password_hash=hash_password(password), role="PLAYER", is_active=True,
            )
            db.add(user)
            db.flush()  # get user.id before creating the profile row

            profile = PlayerProfile(
                user_id=user.id, age=spec["age"], player_role=spec["role"],
                batting_style=spec["battingStyle"], bowling_style=spec["bowlingStyle"],
                height_cm=spec["heightCm"], weight_kg=spec["weightKg"],
            )
            db.add(profile)
            db.commit()
            created.append((public_id, spec["name"], username))

        print(f"Created {len(created)} new demo player(s):")
        for public_id, name, username in created:
            print(f"  {public_id}  {name:<24} ({username})")

        print(f"\nSkipped {len(skipped)} already-existing player(s) (account/name/password left untouched):")
        for public_id, name, username in skipped:
            print(f"  {public_id}  {name:<24} ({username})")

        if backfilled:
            print(f"\nBackfilled missing profile field(s) on {len(backfilled)} existing player(s):")
            for public_id, name, fields in backfilled:
                print(f"  {public_id}  {name:<24} -> filled: {', '.join(fields)}")

        if created:
            print(f"\nAll newly-created seeded players use the password: {password}")
        if not created and not skipped:
            print("Nothing to do.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
