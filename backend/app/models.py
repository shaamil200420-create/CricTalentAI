"""
SQLAlchemy models — one class per table. Kept deliberately simple: plain
String columns for status/role values (validated in schemas.py / the
routers) instead of MySQL ENUM types, so there is nothing special to
migrate if a value list ever needs to change.

Tables map directly onto what the existing Admin frontend pages already
show — see the comment above each class for which page it backs.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Float, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    """
    One row per login account — Admin, Coach or Player. This is the single
    table real authentication (POST /api/auth/login) checks against.

    `public_id` is the short display ID the frontend already shows
    everywhere (A001 / C001 / P001) — NOT the same as the internal `id`
    primary key, which is just an ordinary auto-increment integer.
    `specialization` is Coach-only (Admin Coach Management's one extra
    profile field); it stays a plain nullable column here rather than a
    whole separate coach_profiles table for a single field.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=True)
    phone = Column(String(40), nullable=True)
    specialization = Column(String(120), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False)  # 'ADMIN' | 'COACH' | 'PLAYER'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    player_profile = relationship("PlayerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class PlayerProfile(Base):
    """
    The cricket-profile half of a Player account (Admin -> Player
    Management). One-to-one with a `users` row where role = 'PLAYER'.
    """
    __tablename__ = "player_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, nullable=True)
    player_role = Column(String(30), nullable=True)  # Batter | Bowler | All-Rounder | Wicketkeeper-Batter
    batting_style = Column(String(60), nullable=True)
    bowling_style = Column(String(60), nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)

    user = relationship("User", back_populates="player_profile")


class Tournament(Base):
    """Admin -> Tournament Management."""
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    format = Column(String(10), default="T20", nullable=False)  # T20 only
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    teams = Column(Integer, default=2, nullable=False)
    status = Column(String(20), default="Upcoming", nullable=False)  # Upcoming | Ongoing | Completed | Cancelled


class Match(Base):
    """
    THE single shared Match Schedule record — one row per scheduled match,
    however it was created:
      - Admin -> Schedule Management -> Create Schedule -> Match
      - Coach -> Matches -> Add Match Schedule
      - Admin -> Tournament Management -> a tournament's "Add Match"
    All three write to this same table/row, so there is exactly one match
    record for Admin/Coach/Player to see — never separate copies.

    tournament_id is nullable: a match with no tournament is a
    friendly/practice match ("Friendly / None" in the Tournament dropdown).

    Fixture/result info ONLY (opponent, tournament, date, time, venue,
    format, status, Win/Loss/No Result). No batting/bowling/fielding
    figures live here; those belong to the separate Coach Match Entry /
    Match Performance backend, which is out of scope for this task.
    """
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    opponent = Column(String(150), nullable=False)
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    venue = Column(String(150), nullable=True)
    format = Column(String(10), default="T20", nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    status = Column(String(20), default="Scheduled", nullable=False)  # Scheduled | Completed | Cancelled
    result = Column(String(20), nullable=True)  # Win | Loss | No Result

    tournament = relationship("Tournament")


class Schedule(Base):
    """
    THE single shared Training Schedule record (public_id prefix "TR").
    One row per scheduled training session, however it was created:
      - Admin -> Schedule Management -> Create Schedule -> Training
      - Coach -> Training -> Add Training Schedule
    Both write to this same table/row, so there is exactly one training
    record for Admin/Coach/Player to see.

    Match schedules used to also live in this table (`kind` = 'Match'),
    but now live in the dedicated `matches` table above instead (it has
    the extra opponent/tournament/format/result fields a match actually
    needs) — `kind` stays on the model for any old rows, but new code
    only ever writes 'Training' here.
    """
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    kind = Column(String(10), nullable=False, default="Training")  # always 'Training' going forward
    title = Column(String(150), nullable=False)
    training_type = Column(String(20), nullable=True)  # Batting | Bowling | Fielding | Fitness | General
    date = Column(Date, nullable=True)
    time = Column(Time, nullable=True)
    venue = Column(String(150), nullable=True)
    status = Column(String(20), default="Scheduled", nullable=False)  # Scheduled | Completed | Cancelled


class MatchPerformance(Base):
    """
    Coach -> Match Entry (create) / Match Records (view, edit, remove) —
    THE real, MySQL-persisted performance record, replacing the old
    frontend-only matchPerformanceStore.js (browser localStorage) demo
    store. Belongs to an EXISTING Player (`users`, role=PLAYER — never a
    second Player table) and an EXISTING Match (`matches` — never a
    second Match/fixture system). Exactly one row may exist per
    (player_id, match_id) pair — enforced by the unique constraint below
    AND re-checked in routers/match_performance.py before insert, so a
    Coach always gets a clear "already exists, use Edit" error rather than
    a raw database integrity error.

    `overs_bowled` is nullable CRICKET-NOTATION TEXT (e.g. "3.5" = 3 overs
    + 5 legal balls) — NOT a decimal number, and never computed as one.
    NULL here specifically means "this player did NOT bowl in this
    match" — distinct from bowling and taking 0 wickets (which stores a
    real overs_bowled value with wickets=0). runs_conceded / wickets /
    maidens / dot_balls / wides / no_balls / economy_rate are all kept
    NULL together with overs_bowled for that same reason — see
    _recompute_and_validate() in routers/match_performance.py, which is
    the ONLY place these fields are ever set. Similarly, runs / balls_faced
    / fours / sixes / batting_position are NULL when dismissal_type is
    "Did Not Bat".

    strike_rate, boundary_runs, economy_rate and fielding_score are always
    SERVER-COMPUTED from the raw fields above (never accepted from the
    client — the Pydantic schemas don't even have a field for them) —
    kept as real columns so they can be queried directly later (e.g. as a
    future ML feature) rather than only ever derived on the fly.
    """
    __tablename__ = "match_performance"
    __table_args__ = (UniqueConstraint("player_id", "match_id", name="uq_match_performance_player_match"),)

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)

    # Batting — NULL together when dismissal_type == "Did Not Bat"
    batting_position = Column(Integer, nullable=True)
    runs = Column(Integer, nullable=True)
    balls_faced = Column(Integer, nullable=True)
    dismissal_type = Column(String(20), nullable=False, default="Not Out")
    fours = Column(Integer, nullable=True)
    sixes = Column(Integer, nullable=True)
    strike_rate = Column(Float, nullable=True)
    boundary_runs = Column(Integer, nullable=True)

    # Bowling — NULL together when overs_bowled is NULL (did not bowl)
    overs_bowled = Column(String(10), nullable=True)
    runs_conceded = Column(Integer, nullable=True)
    wickets = Column(Integer, nullable=True)
    maidens = Column(Integer, nullable=True)
    dot_balls = Column(Integer, nullable=True)
    wides = Column(Integer, nullable=True)
    no_balls = Column(Integer, nullable=True)
    economy_rate = Column(Float, nullable=True)

    # Fielding — every player can field, so these are never null
    catches = Column(Integer, nullable=False, default=0)
    dropped_catches = Column(Integer, nullable=False, default=0)
    run_outs = Column(Integer, nullable=False, default=0)
    stumpings = Column(Integer, nullable=False, default=0)
    misfields = Column(Integer, nullable=False, default=0)
    fielding_score = Column(Integer, nullable=False, default=0)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    player = relationship("User")
    match = relationship("Match")


class TrainingRecord(Base):
    """
    Coach -> Training Entry (create) / Player -> My Training Records (view
    own) — THE real, MySQL-persisted training record, replacing the old
    Training Entry page's temporary React-state-only "Saved This Session"
    table. Belongs to an EXISTING Player (`users`, role=PLAYER) and an
    EXISTING Training Schedule (`schedules`, kind='Training' — never a
    second training-session system). Exactly one row may exist per
    (player_id, schedule_id) pair.
    """
    __tablename__ = "training_records"
    __table_args__ = (UniqueConstraint("player_id", "schedule_id", name="uq_training_record_player_schedule"),)

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)

    attendance = Column(String(10), nullable=False, default="Present")  # 'Present' | 'Absent'
    drills_assigned = Column(Integer, nullable=True)
    drills_completed = Column(Integer, nullable=True)
    batting_practice = Column(Integer, nullable=True)
    bowling_practice = Column(Integer, nullable=True)
    fielding_score = Column(Integer, nullable=True)
    fitness_score = Column(Integer, nullable=True)
    coach_rating = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    player = relationship("User")
    schedule = relationship("Schedule")


class PlayerGoal(Base):
    """
    Coach -> Goal Tracking (create/manage) / Player -> My Goals (view own
    only). A short-term, Coach-set goal for an EXISTING Player — never a
    second player table. Distinct from PlayerDevelopmentPlan below: a Goal
    is a single short-term target + deadline, a Development Plan is a
    longer objective with a start/target date range and free-text notes —
    the existing frontend (Coach -> Goal Tracking vs Coach -> Development
    Plan) already treats these as two separate concepts, so the backend
    mirrors that instead of forcing them into one shape.
    """
    __tablename__ = "player_goals"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    focus_area = Column(String(150), nullable=False)
    target = Column(String(255), nullable=True)
    deadline = Column(Date, nullable=True)
    progress_pct = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="In Progress")  # In Progress | Achieved | Missed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    player = relationship("User", foreign_keys=[player_id])
    coach = relationship("User", foreign_keys=[coach_id])


class PlayerDevelopmentPlan(Base):
    """
    Coach -> Development Plan (create/manage) / Player -> My Development
    Report (view own only). One longer-term development focus per Player at
    a time in the existing UI, with a free-text objective/notes and a
    start-date -> target-date range — this is genuinely Coach-authored
    content with no other real source, so it needs its own small table
    (see Part 10 of the spec: "if the current page requires persistent
    Coach-written development notes... add only the minimal table needed").
    """
    __tablename__ = "player_development_plans"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    focus_area = Column(String(150), nullable=False)
    objective = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True)
    progress_pct = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="Active")  # Active | Completed | On Hold
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    player = relationship("User", foreign_keys=[player_id])
    coach = relationship("User", foreign_keys=[coach_id])


class PlayerFeedback(Base):
    """
    Coach -> Player feedback notes (created from the Coach -> Player List
    detail modal's Feedback tab) / Player -> My Feedback (view own,
    PLAYER_VISIBLE only — a PRIVATE note is an internal coach-only
    observation and must never reach the Player portal).
    """
    __tablename__ = "player_feedback"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(20), unique=True, index=True, nullable=False)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    text = Column(Text, nullable=False)
    strengths = Column(String(255), nullable=True)
    areas_to_improve = Column(String(255), nullable=True)
    visibility = Column(String(20), nullable=False, default="PLAYER_VISIBLE")  # PLAYER_VISIBLE | PRIVATE
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    player = relationship("User", foreign_keys=[player_id])
    coach = relationship("User", foreign_keys=[coach_id])
