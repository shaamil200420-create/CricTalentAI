"""
Pydantic request/response models. Field names intentionally match what the
existing React pages already use (camelCase like `heightCm`, `battingStyle`,
`since`, `status` as the string "Active"/"Inactive") so the frontend needs
the smallest possible changes to switch from local mock state to real API
calls.
"""
from datetime import date as _date
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator

# Several schemas below have a field literally named `date` (matching the
# frontend's field names). Importing the `date` TYPE under a different
# name (`_date`) avoids a field named `date` shadowing the type it's
# annotated with, which otherwise breaks Pydantic's annotation resolution.

PLAYER_ROLES = ["Batter", "Bowler", "All-Rounder", "Wicketkeeper-Batter"]
STATUS_VALUES = ["Active", "Inactive"]


def _blank_to_none(v):
    """An empty string from an optional HTML date input should mean 'not
    set', not a validation error — Pydantic's date parser otherwise
    rejects "" outright."""
    return None if v == "" else v


# ---------- Auth ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: Literal["ADMIN", "COACH", "PLAYER"]
    id: str
    name: str
    username: str


class CurrentUser(BaseModel):
    id: str
    name: str
    username: str
    email: Optional[str] = None
    role: Literal["ADMIN", "COACH", "PLAYER"]
    status: str


# ---------- Admin Management ----------

class AdminCreate(BaseModel):
    name: str
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[Literal["Active", "Inactive"]] = None
    newPassword: Optional[str] = None


class AdminOut(BaseModel):
    id: str
    name: str
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    since: Optional[_date] = None
    status: str


class StatusUpdate(BaseModel):
    status: Literal["Active", "Inactive"]


class PasswordUpdate(BaseModel):
    newPassword: str


# ---------- Coach Management ----------

class CoachCreate(BaseModel):
    name: str
    username: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    password: str


class CoachUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    status: Optional[Literal["Active", "Inactive"]] = None
    newPassword: Optional[str] = None


class CoachOut(BaseModel):
    id: str
    name: str
    username: str
    phone: Optional[str] = None
    specialization: Optional[str] = None
    since: Optional[_date] = None
    status: str


# ---------- Player Management ----------

class PlayerCreate(BaseModel):
    username: str
    password: str
    name: str
    age: Optional[int] = None
    role: Optional[str] = None
    battingStyle: Optional[str] = None
    bowlingStyle: Optional[str] = None
    heightCm: Optional[int] = None
    weightKg: Optional[int] = None

    @field_validator("role")
    @classmethod
    def role_must_be_known(cls, v):
        if v is not None and v not in PLAYER_ROLES:
            raise ValueError(f"role must be one of {PLAYER_ROLES}")
        return v


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    role: Optional[str] = None
    battingStyle: Optional[str] = None
    bowlingStyle: Optional[str] = None
    heightCm: Optional[int] = None
    weightKg: Optional[int] = None
    status: Optional[Literal["Active", "Inactive"]] = None
    newPassword: Optional[str] = None

    @field_validator("role")
    @classmethod
    def role_must_be_known(cls, v):
        if v is not None and v not in PLAYER_ROLES:
            raise ValueError(f"role must be one of {PLAYER_ROLES}")
        return v


class PlayerOut(BaseModel):
    id: str
    username: str
    name: str
    age: Optional[int] = None
    role: Optional[str] = None
    battingStyle: Optional[str] = None
    bowlingStyle: Optional[str] = None
    heightCm: Optional[int] = None
    weightKg: Optional[int] = None
    status: str


# ---------- Tournament Management ----------

class TournamentCreate(BaseModel):
    name: str
    startDate: Optional[_date] = None
    endDate: Optional[_date] = None
    teams: Optional[int] = 2

    _blank_dates = field_validator("startDate", "endDate", mode="before")(_blank_to_none)


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    startDate: Optional[_date] = None
    endDate: Optional[_date] = None
    teams: Optional[int] = None
    status: Optional[Literal["Upcoming", "Ongoing", "Completed", "Cancelled"]] = None

    _blank_dates = field_validator("startDate", "endDate", mode="before")(_blank_to_none)


class TournamentOut(BaseModel):
    id: str
    name: str
    format: str
    startDate: Optional[_date] = None
    endDate: Optional[_date] = None
    teams: int
    status: str


class MatchCreate(BaseModel):
    opponent: str
    tournamentId: Optional[str] = None  # a Tournament's public id, or "" / None for Friendly
    date: Optional[_date] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    status: Optional[Literal["Scheduled", "Completed", "Cancelled"]] = None

    _blank_date = field_validator("date", mode="before")(_blank_to_none)


class MatchUpdate(BaseModel):
    """Full edit for the shared Match Schedule Form (Admin + Coach). Match ID
    and Format are never editable — everything else can change in place,
    updating the SAME record (no new row is ever created here)."""
    opponent: Optional[str] = None
    tournamentId: Optional[str] = None  # "" clears to Friendly/None; omitted = leave unchanged
    date: Optional[_date] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    status: Optional[Literal["Scheduled", "Completed", "Cancelled"]] = None

    _blank_date = field_validator("date", mode="before")(_blank_to_none)


class MatchResultUpdate(BaseModel):
    result: Literal["Win", "Loss", "No Result"]


class MatchOut(BaseModel):
    id: str
    opponent: str
    tournamentId: Optional[str] = None
    date: Optional[_date] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    format: str
    tournament: Optional[str] = None
    status: str
    result: Optional[str] = None


# ---------- Schedule Management (Training Schedule — the shared record for
# Admin -> Schedule Management -> Create Schedule -> Training and
# Coach -> Training -> Add Training Schedule) ----------

TRAINING_TYPES = ["Batting", "Bowling", "Fielding", "Fitness", "General"]


class ScheduleCreate(BaseModel):
    title: str
    trainingType: Optional[str] = None
    date: Optional[_date] = None
    time: Optional[str] = None
    venue: Optional[str] = None

    _blank_date = field_validator("date", mode="before")(_blank_to_none)


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    trainingType: Optional[str] = None
    date: Optional[_date] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    status: Optional[Literal["Scheduled", "Completed", "Cancelled"]] = None

    _blank_date = field_validator("date", mode="before")(_blank_to_none)


class ScheduleOut(BaseModel):
    id: str
    kind: str
    title: str
    trainingType: Optional[str] = None
    date: Optional[_date] = None
    time: Optional[str] = None
    venue: Optional[str] = None
    status: str


# ---------- Dashboard ----------

class RecentUserOut(BaseModel):
    id: str
    name: str
    username: str
    role: str
    status: str


class DashboardOut(BaseModel):
    totalUsers: int
    activeCoaches: int
    activePlayers: int
    ongoingTournaments: int
    recentUsers: List[RecentUserOut]
    tournaments: List[TournamentOut]


# ---------- Match Performance (Coach -> Match Entry / Match Records;
# Player -> My Match Stats reads its own records only) ----------

DISMISSAL_TYPES = ["Caught", "Bowled", "LBW", "Run Out", "Stumped", "Not Out", "Did Not Bat"]


def _blank_str_to_none(v):
    if v is None:
        return None
    s = str(v).strip()
    return None if s == "" else s


def _blank_int_to_none(v):
    """An empty string from a disabled/cleared number input ('Did Not Bat'
    zeroes battingPosition to '' on the frontend, Training Entry's EMPTY
    form starts every practice-score field as '') should mean 'not set',
    not a validation error — Pydantic's int parser otherwise rejects ""
    outright."""
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


class MatchPerformanceCreate(BaseModel):
    playerId: str
    matchId: str
    battingPosition: Optional[int] = Field(default=None, ge=1, le=11)
    runs: Optional[int] = Field(default=0, ge=0, le=300)
    ballsFaced: Optional[int] = Field(default=0, ge=0, le=150)
    dismissalType: str = "Not Out"
    fours: Optional[int] = Field(default=0, ge=0)
    sixes: Optional[int] = Field(default=0, ge=0)
    oversBowled: Optional[str] = None
    runsConceded: Optional[int] = Field(default=0, ge=0, le=150)
    wickets: Optional[int] = Field(default=0, ge=0, le=10)
    maidens: Optional[int] = Field(default=0, ge=0)  # dynamic ceiling (<= completed overs) enforced in the router
    dotBalls: Optional[int] = Field(default=0, ge=0)  # dynamic ceiling (<= legal balls bowled) enforced in the router
    wides: Optional[int] = Field(default=0, ge=0, le=30)
    noBalls: Optional[int] = Field(default=0, ge=0, le=30)
    catches: Optional[int] = Field(default=0, ge=0, le=10)
    droppedCatches: Optional[int] = Field(default=0, ge=0, le=15)
    runOuts: Optional[int] = Field(default=0, ge=0, le=10)
    stumpings: Optional[int] = Field(default=0, ge=0, le=10)
    misfields: Optional[int] = Field(default=0, ge=0, le=20)
    notes: Optional[str] = None

    _blank_overs = field_validator("oversBowled", mode="before")(_blank_str_to_none)
    _blank_ints = field_validator(
        "battingPosition", "runs", "ballsFaced", "fours", "sixes",
        "runsConceded", "wickets", "maidens", "dotBalls", "wides", "noBalls",
        "catches", "droppedCatches", "runOuts", "stumpings", "misfields",
        mode="before",
    )(_blank_int_to_none)

    @field_validator("dismissalType")
    @classmethod
    def dismissal_must_be_known(cls, v):
        if v not in DISMISSAL_TYPES:
            raise ValueError(f"dismissalType must be one of {DISMISSAL_TYPES}")
        return v


class MatchPerformanceUpdate(BaseModel):
    """Identity (playerId/matchId) is intentionally absent — locked once
    created, matching Match Records' 'Player and match cannot be changed
    here' rule. Everything else can change in place, updating the SAME
    row (never a new one)."""
    battingPosition: Optional[int] = Field(default=None, ge=1, le=11)
    runs: Optional[int] = Field(default=None, ge=0, le=300)
    ballsFaced: Optional[int] = Field(default=None, ge=0, le=150)
    dismissalType: Optional[str] = None
    fours: Optional[int] = Field(default=None, ge=0)
    sixes: Optional[int] = Field(default=None, ge=0)
    oversBowled: Optional[str] = None
    runsConceded: Optional[int] = Field(default=None, ge=0, le=150)
    wickets: Optional[int] = Field(default=None, ge=0, le=10)
    maidens: Optional[int] = Field(default=None, ge=0)  # dynamic ceiling (<= completed overs) enforced in the router
    dotBalls: Optional[int] = Field(default=None, ge=0)  # dynamic ceiling (<= legal balls bowled) enforced in the router
    wides: Optional[int] = Field(default=None, ge=0, le=30)
    noBalls: Optional[int] = Field(default=None, ge=0, le=30)
    catches: Optional[int] = Field(default=None, ge=0, le=10)
    droppedCatches: Optional[int] = Field(default=None, ge=0, le=15)
    runOuts: Optional[int] = Field(default=None, ge=0, le=10)
    stumpings: Optional[int] = Field(default=None, ge=0, le=10)
    misfields: Optional[int] = Field(default=None, ge=0, le=20)
    notes: Optional[str] = None

    _blank_overs = field_validator("oversBowled", mode="before")(_blank_str_to_none)
    _blank_ints = field_validator(
        "battingPosition", "runs", "ballsFaced", "fours", "sixes",
        "runsConceded", "wickets", "maidens", "dotBalls", "wides", "noBalls",
        "catches", "droppedCatches", "runOuts", "stumpings", "misfields",
        mode="before",
    )(_blank_int_to_none)

    @field_validator("dismissalType")
    @classmethod
    def dismissal_must_be_known(cls, v):
        if v is not None and v not in DISMISSAL_TYPES:
            raise ValueError(f"dismissalType must be one of {DISMISSAL_TYPES}")
        return v


class MatchPerformanceOut(BaseModel):
    id: str
    playerId: str
    matchId: str
    battingPosition: Optional[int] = None
    runs: Optional[int] = None
    ballsFaced: Optional[int] = None
    dismissalType: str
    fours: Optional[int] = None
    sixes: Optional[int] = None
    strikeRate: Optional[float] = None
    boundaryRuns: Optional[int] = None
    oversBowled: Optional[str] = None
    runsConceded: Optional[int] = None
    wickets: Optional[int] = None
    maidens: Optional[int] = None
    dotBalls: Optional[int] = None
    wides: Optional[int] = None
    noBalls: Optional[int] = None
    economyRate: Optional[float] = None
    catches: int
    droppedCatches: int
    runOuts: int
    stumpings: int
    misfields: int
    fieldingScore: int
    notes: Optional[str] = None


# ---------- Training Records (Coach -> Training Entry;
# Player -> My Training Records reads its own records only) ----------

ATTENDANCE_VALUES = ["Present", "Absent"]


class TrainingRecordCreate(BaseModel):
    playerId: str
    sessionId: str  # a Training Schedule's public_id, e.g. "TR003"
    attendance: str = "Present"
    drillsAssigned: Optional[int] = Field(default=None, ge=0)
    drillsCompleted: Optional[int] = Field(default=None, ge=0)
    battingPractice: Optional[int] = Field(default=None, ge=0, le=100)
    bowlingPractice: Optional[int] = Field(default=None, ge=0, le=100)
    fieldingScore: Optional[int] = Field(default=None, ge=0, le=100)
    fitnessScore: Optional[int] = Field(default=None, ge=0, le=100)
    coachRating: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = None

    _blank_ints = field_validator(
        "drillsAssigned", "drillsCompleted", "battingPractice", "bowlingPractice",
        "fieldingScore", "fitnessScore", "coachRating",
        mode="before",
    )(_blank_int_to_none)

    @field_validator("attendance")
    @classmethod
    def attendance_must_be_known(cls, v):
        if v not in ATTENDANCE_VALUES:
            raise ValueError(f"attendance must be one of {ATTENDANCE_VALUES}")
        return v


class TrainingRecordUpdate(BaseModel):
    attendance: Optional[str] = None
    drillsAssigned: Optional[int] = Field(default=None, ge=0)
    drillsCompleted: Optional[int] = Field(default=None, ge=0)
    battingPractice: Optional[int] = Field(default=None, ge=0, le=100)
    bowlingPractice: Optional[int] = Field(default=None, ge=0, le=100)
    fieldingScore: Optional[int] = Field(default=None, ge=0, le=100)
    fitnessScore: Optional[int] = Field(default=None, ge=0, le=100)
    coachRating: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = None

    _blank_ints = field_validator(
        "drillsAssigned", "drillsCompleted", "battingPractice", "bowlingPractice",
        "fieldingScore", "fitnessScore", "coachRating",
        mode="before",
    )(_blank_int_to_none)

    @field_validator("attendance")
    @classmethod
    def attendance_must_be_known(cls, v):
        if v is not None and v not in ATTENDANCE_VALUES:
            raise ValueError(f"attendance must be one of {ATTENDANCE_VALUES}")
        return v


class TrainingRecordOut(BaseModel):
    id: str
    playerId: str
    sessionId: str
    attendance: str
    drillsAssigned: Optional[int] = None
    drillsCompleted: Optional[int] = None
    battingPractice: Optional[int] = None
    bowlingPractice: Optional[int] = None
    fieldingScore: Optional[int] = None
    fitnessScore: Optional[int] = None
    coachRating: Optional[int] = None
    notes: Optional[str] = None


# ---------- Goals (Coach -> Goal Tracking; Player -> My Goals, view own only) ----------

GOAL_STATUS_VALUES = ["In Progress", "Achieved", "Missed"]


class GoalCreate(BaseModel):
    playerId: str
    focusArea: str
    target: Optional[str] = None
    deadline: Optional[_date] = None
    progressPct: int = Field(default=0, ge=0, le=100)
    status: str = "In Progress"

    _blank_target = field_validator("target", mode="before")(_blank_str_to_none)
    _blank_deadline = field_validator("deadline", mode="before")(_blank_str_to_none)

    @field_validator("status")
    @classmethod
    def status_must_be_known(cls, v):
        if v not in GOAL_STATUS_VALUES:
            raise ValueError(f"status must be one of {GOAL_STATUS_VALUES}")
        return v


class GoalUpdate(BaseModel):
    focusArea: Optional[str] = None
    target: Optional[str] = None
    deadline: Optional[_date] = None
    progressPct: Optional[int] = Field(default=None, ge=0, le=100)
    status: Optional[str] = None

    _blank_target = field_validator("target", mode="before")(_blank_str_to_none)
    _blank_deadline = field_validator("deadline", mode="before")(_blank_str_to_none)

    @field_validator("status")
    @classmethod
    def status_must_be_known(cls, v):
        if v is not None and v not in GOAL_STATUS_VALUES:
            raise ValueError(f"status must be one of {GOAL_STATUS_VALUES}")
        return v


class GoalOut(BaseModel):
    id: str
    playerId: str
    focusArea: str
    target: Optional[str] = None
    deadline: Optional[_date] = None
    progressPct: int
    status: str


# ---------- Development Plans (Coach -> Development Plan; Player -> My Development Report, view own only) ----------

DEV_PLAN_STATUS_VALUES = ["Active", "Completed", "On Hold"]


class DevelopmentPlanCreate(BaseModel):
    playerId: str
    focusArea: str
    objective: Optional[str] = None
    startDate: Optional[_date] = None
    targetDate: Optional[_date] = None
    progressPct: int = Field(default=0, ge=0, le=100)
    status: str = "Active"
    notes: Optional[str] = None

    _blank_objective = field_validator("objective", mode="before")(_blank_str_to_none)
    _blank_start = field_validator("startDate", mode="before")(_blank_str_to_none)
    _blank_target_date = field_validator("targetDate", mode="before")(_blank_str_to_none)
    _blank_notes = field_validator("notes", mode="before")(_blank_str_to_none)

    @field_validator("status")
    @classmethod
    def status_must_be_known(cls, v):
        if v not in DEV_PLAN_STATUS_VALUES:
            raise ValueError(f"status must be one of {DEV_PLAN_STATUS_VALUES}")
        return v


class DevelopmentPlanUpdate(BaseModel):
    focusArea: Optional[str] = None
    objective: Optional[str] = None
    startDate: Optional[_date] = None
    targetDate: Optional[_date] = None
    progressPct: Optional[int] = Field(default=None, ge=0, le=100)
    status: Optional[str] = None
    notes: Optional[str] = None

    _blank_objective = field_validator("objective", mode="before")(_blank_str_to_none)
    _blank_start = field_validator("startDate", mode="before")(_blank_str_to_none)
    _blank_target_date = field_validator("targetDate", mode="before")(_blank_str_to_none)
    _blank_notes = field_validator("notes", mode="before")(_blank_str_to_none)

    @field_validator("status")
    @classmethod
    def status_must_be_known(cls, v):
        if v is not None and v not in DEV_PLAN_STATUS_VALUES:
            raise ValueError(f"status must be one of {DEV_PLAN_STATUS_VALUES}")
        return v


class DevelopmentPlanOut(BaseModel):
    id: str
    playerId: str
    focusArea: str
    objective: Optional[str] = None
    startDate: Optional[_date] = None
    targetDate: Optional[_date] = None
    progressPct: int
    status: str
    notes: Optional[str] = None


# ---------- Feedback (Coach -> Player List Feedback tab; Player -> My Feedback, view own PLAYER_VISIBLE only) ----------

FEEDBACK_VISIBILITY_VALUES = ["PLAYER_VISIBLE", "PRIVATE"]


class FeedbackCreate(BaseModel):
    playerId: str
    text: str
    strengths: Optional[str] = None
    areasToImprove: Optional[str] = None
    visibility: str = "PLAYER_VISIBLE"

    _blank_strengths = field_validator("strengths", mode="before")(_blank_str_to_none)
    _blank_areas = field_validator("areasToImprove", mode="before")(_blank_str_to_none)

    @field_validator("visibility")
    @classmethod
    def visibility_must_be_known(cls, v):
        if v not in FEEDBACK_VISIBILITY_VALUES:
            raise ValueError(f"visibility must be one of {FEEDBACK_VISIBILITY_VALUES}")
        return v


class FeedbackUpdate(BaseModel):
    text: Optional[str] = None
    strengths: Optional[str] = None
    areasToImprove: Optional[str] = None
    visibility: Optional[str] = None

    _blank_strengths = field_validator("strengths", mode="before")(_blank_str_to_none)
    _blank_areas = field_validator("areasToImprove", mode="before")(_blank_str_to_none)

    @field_validator("visibility")
    @classmethod
    def visibility_must_be_known(cls, v):
        if v is not None and v not in FEEDBACK_VISIBILITY_VALUES:
            raise ValueError(f"visibility must be one of {FEEDBACK_VISIBILITY_VALUES}")
        return v


class FeedbackOut(BaseModel):
    id: str
    playerId: str
    date: _date
    text: str
    strengths: Optional[str] = None
    areasToImprove: Optional[str] = None
    visibility: str
    coachName: Optional[str] = None
