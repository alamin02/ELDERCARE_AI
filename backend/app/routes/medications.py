import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User,
    Medication,
    MedicationSchedule,
    MedicationLog
)
from backend.app.schemas import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    MedicationLogCreate,
    MedicationLogResponse,
    TodayMedicationItem
)
from backend.app.security.rbac import get_current_user, verify_and_resolve_elderly_id
from backend.app.services.medication_service import get_today_medication_schedule

router = APIRouter(prefix="/medications", tags=["Medication Management"])


@router.get("", response_model=List[MedicationResponse])
def list_medications(
    elderly_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all medications for authorized elderly patient."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    query = db.query(Medication).filter(Medication.elderly_id == resolved_id)
    if is_active is not None:
        query = query.filter(Medication.is_active == is_active)
    meds = query.order_by(Medication.created_at.desc()).all()
    return meds


@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(
    payload: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new medication and its schedule."""
    resolved_id = verify_and_resolve_elderly_id(payload.elderly_id, current_user, db)

    new_med = Medication(
        elderly_id=resolved_id,
        name=payload.name.strip(),
        dosage=payload.dosage.strip(),
        frequency=payload.frequency.strip(),
        instructions=payload.instructions,
        prescribing_doctor=payload.prescribing_doctor,
        start_date=payload.start_date or datetime.date.today(),
        end_date=payload.end_date,
        is_active=payload.is_active
    )
    db.add(new_med)
    db.flush()

    # Create schedules if supplied
    for sched_item in payload.schedules:
        schedule = MedicationSchedule(
            medication_id=new_med.id,
            elderly_id=resolved_id,
            scheduled_time=sched_item.scheduled_time,
            day_of_week=sched_item.day_of_week
        )
        db.add(schedule)

    db.commit()
    db.refresh(new_med)
    return new_med


@router.get("/{medication_id}", response_model=MedicationResponse)
def get_medication(
    medication_id: int,
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a single medication."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == resolved_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    return med


@router.put("/{medication_id}", response_model=MedicationResponse)
def update_medication(
    medication_id: int,
    payload: MedicationUpdate,
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update medicine details and optionally update schedule times."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == resolved_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    if payload.name is not None:
        med.name = payload.name.strip()
    if payload.dosage is not None:
        med.dosage = payload.dosage.strip()
    if payload.frequency is not None:
        med.frequency = payload.frequency.strip()
    if payload.instructions is not None:
        med.instructions = payload.instructions
    if payload.prescribing_doctor is not None:
        med.prescribing_doctor = payload.prescribing_doctor
    if payload.start_date is not None:
        med.start_date = payload.start_date
    if payload.end_date is not None:
        med.end_date = payload.end_date
    if payload.is_active is not None:
        med.is_active = payload.is_active

    if payload.schedules is not None:
        # Replace schedules
        db.query(MedicationSchedule).filter(MedicationSchedule.medication_id == med.id).delete()
        for sched_item in payload.schedules:
            new_sched = MedicationSchedule(
                medication_id=med.id,
                elderly_id=resolved_id,
                scheduled_time=sched_item.scheduled_time,
                day_of_week=sched_item.day_of_week
            )
            db.add(new_sched)

    db.commit()
    db.refresh(med)
    return med


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(
    medication_id: int,
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a medication."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.elderly_id == resolved_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    db.delete(med)
    db.commit()
    return None


@router.get("/today/schedule", response_model=List[TodayMedicationItem])
def get_today_schedule(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve today's schedule with real-time status (taken, skipped, missed, pending)."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    return get_today_medication_schedule(resolved_id, db)


@router.post("/log", response_model=MedicationLogResponse)
def log_medication_action(
    payload: MedicationLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a medication dose as Taken, Skipped, or Missed."""
    resolved_id = verify_and_resolve_elderly_id(payload.elderly_id, current_user, db)

    # Verify medication belongs to elderly
    med = db.query(Medication).filter(
        Medication.id == payload.medication_id,
        Medication.elderly_id == resolved_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    # Record or update log for today
    today = datetime.date.today()
    start_of_day = datetime.datetime.combine(today, datetime.time.min)
    end_of_day = datetime.datetime.combine(today, datetime.time.max)

    existing_log = db.query(MedicationLog).filter(
        MedicationLog.medication_id == payload.medication_id,
        MedicationLog.elderly_id == resolved_id,
        MedicationLog.scheduled_time == payload.scheduled_time,
        MedicationLog.created_at >= start_of_day,
        MedicationLog.created_at <= end_of_day
    ).first()

    now = datetime.datetime.now()
    if existing_log:
        existing_log.status = payload.status
        existing_log.actual_time = now if payload.status == "taken" else None
        existing_log.notes = payload.notes
        existing_log.marked_by_id = current_user.id
        db.commit()
        db.refresh(existing_log)
        resp = MedicationLogResponse.from_orm(existing_log)
        resp.medication_name = med.name
        return resp
    else:
        new_log = MedicationLog(
            schedule_id=payload.schedule_id,
            medication_id=payload.medication_id,
            elderly_id=resolved_id,
            scheduled_time=payload.scheduled_time,
            actual_time=now if payload.status == "taken" else None,
            status=payload.status,
            notes=payload.notes,
            marked_by_id=current_user.id
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        resp = MedicationLogResponse.from_orm(new_log)
        resp.medication_name = med.name
        return resp


@router.get("/history/logs", response_model=List[MedicationLogResponse])
def get_medication_history(
    elderly_id: Optional[int] = Query(None),
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical medication logs for adherence tracking."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    since_date = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    logs = db.query(MedicationLog).filter(
        MedicationLog.elderly_id == resolved_id,
        MedicationLog.created_at >= since_date
    ).order_by(MedicationLog.created_at.desc()).all()

    result = []
    for log in logs:
        item = MedicationLogResponse.from_orm(log)
        if log.medication:
            item.medication_name = log.medication.name
        result.append(item)
    return result
