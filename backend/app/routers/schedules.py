"""
Training Schedule — THE shared Training Schedule endpoints used by:
  - Admin -> Schedule Management -> Create Schedule -> Training
  - Coach -> Training -> Add Training Schedule
Both pages read/write the exact same `schedules` table rows through this
one router, so there is never more than one record per scheduled session.

Player -> My Schedule only needs GET (any logged-in role); Create/Edit/
Cancel/Delete are Admin-or-Coach only (require_staff).

Match schedules live in the separate `matches` table/router now (see
routers/matches.py) — this router only ever creates/returns 'Training'
rows going forward.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Schedule
from ..schemas import ScheduleCreate, ScheduleUpdate, ScheduleOut
from ..auth import require_staff, get_current_user, next_public_id

router = APIRouter(prefix="/schedules", tags=["schedules"])


def _s_out(s: Schedule) -> ScheduleOut:
    return ScheduleOut(
        id=s.public_id, kind=s.kind, title=s.title, trainingType=s.training_type,
        date=s.date, time=s.time.strftime("%H:%M") if s.time else None, venue=s.venue, status=s.status,
    )


def _parse_time(value):
    if not value:
        return None
    from datetime import datetime as _dt
    return _dt.strptime(value, "%H:%M").time()


def _schedule_has_linked_records(db: Session, s: Schedule) -> bool:
    """
    Delete-safety check: a Training Schedule must not be deleted once real
    Training Entry / attendance records exist for it. That backend/table
    is out of scope for this task and doesn't exist yet, so this always
    returns False today — every caller goes through this one function, so
    wiring in the real check later needs no other code to change.
    """
    return False


@router.get("", response_model=List[ScheduleOut])
def list_schedules(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [_s_out(s) for s in db.query(Schedule).filter(Schedule.kind == "Training").order_by(Schedule.id).all()]


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db), _=Depends(require_staff)):
    s = Schedule(
        public_id=next_public_id(db, "TR", model=Schedule), kind="Training", title=payload.title,
        training_type=payload.trainingType, date=payload.date, time=_parse_time(payload.time),
        venue=payload.venue, status="Scheduled",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return _s_out(s)


def _get_schedule_or_404(db: Session, schedule_id: str) -> Schedule:
    s = db.query(Schedule).filter(Schedule.public_id == schedule_id).first()
    if s is None:
        raise HTTPException(status_code=404, detail="Record not found.")
    return s


@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule(schedule_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _s_out(_get_schedule_or_404(db, schedule_id))


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: str, payload: ScheduleUpdate, db: Session = Depends(get_db), _=Depends(require_staff)):
    s = _get_schedule_or_404(db, schedule_id)
    if payload.title is not None:
        s.title = payload.title
    if payload.trainingType is not None:
        s.training_type = payload.trainingType
    if payload.date is not None:
        s.date = payload.date
    if payload.time is not None:
        s.time = _parse_time(payload.time)
    if payload.venue is not None:
        s.venue = payload.venue
    if payload.status is not None:
        s.status = payload.status
    db.commit()
    db.refresh(s)
    return _s_out(s)


@router.patch("/{schedule_id}/cancel", response_model=ScheduleOut)
def cancel_schedule(schedule_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    s = _get_schedule_or_404(db, schedule_id)
    s.status = "Cancelled"
    db.commit()
    db.refresh(s)
    return _s_out(s)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: str, db: Session = Depends(get_db), _=Depends(require_staff)):
    s = _get_schedule_or_404(db, schedule_id)
    if _schedule_has_linked_records(db, s):
        raise HTTPException(
            status_code=400,
            detail="This schedule cannot be deleted because records are already linked to it. Cancel the schedule instead.",
        )
    db.delete(s)
    db.commit()
