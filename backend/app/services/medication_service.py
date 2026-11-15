import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models import (
    Medication,
    MedicationSchedule,
    MedicationLog,
    ElderlyProfile
)
from backend.app.schemas import TodayMedicationItem


def get_today_medication_schedule(
    elderly_id: int,
    db: Session,
    target_date: Optional[datetime.date] = None
) -> List[TodayMedicationItem]:
    """
    Computes today's comprehensive medication schedule for an elderly patient.
    Evaluates logged statuses ('taken', 'skipped') and detects 'missed' doses
    when scheduled time + grace period (60 mins) has passed without action.
    """
    if target_date is None:
        target_date = datetime.date.today()

    now = datetime.datetime.now()
    current_time_str = now.strftime("%H:%M")

    # Fetch active medications for this elderly patient
    active_meds = db.query(Medication).filter(
        Medication.elderly_id == elderly_id,
        Medication.is_active == True,
        Medication.start_date <= target_date,
        (Medication.end_date == None) | (Medication.end_date >= target_date)
    ).all()

    med_ids = [m.id for m in active_meds]
    if not med_ids:
        return []

    # Fetch schedules
    schedules = db.query(MedicationSchedule).filter(
        MedicationSchedule.medication_id.in_(med_ids),
        MedicationSchedule.elderly_id == elderly_id
    ).order_by(MedicationSchedule.scheduled_time.asc()).all()

    # Fetch logs recorded for target_date
    start_of_day = datetime.datetime.combine(target_date, datetime.time.min)
    end_of_day = datetime.datetime.combine(target_date, datetime.time.max)

    logs = db.query(MedicationLog).filter(
        MedicationLog.elderly_id == elderly_id,
        MedicationLog.created_at >= start_of_day,
        MedicationLog.created_at <= end_of_day
    ).all()

    # Map logs by (schedule_id, scheduled_time) or (medication_id, scheduled_time)
    log_map: Dict[str, MedicationLog] = {}
    for log in logs:
        key = f"{log.medication_id}_{log.scheduled_time}"
        log_map[key] = log

    items: List[TodayMedicationItem] = []
    med_lookup = {m.id: m for m in active_meds}

    for sched in schedules:
        med = med_lookup.get(sched.medication_id)
        if not med:
            continue

        log_key = f"{sched.medication_id}_{sched.scheduled_time}"
        existing_log = log_map.get(log_key)

        status = "pending"
        logged_time = None
        log_id = None

        if existing_log:
            status = existing_log.status  # 'taken', 'skipped', 'missed'
            logged_time = existing_log.actual_time or existing_log.created_at
            log_id = existing_log.id
        else:
            # Deterministic missed detection:
            # If current time is > 60 minutes past scheduled time on today's date
            if target_date == datetime.date.today():
                try:
                    sched_hour, sched_min = map(int, sched.scheduled_time.split(":"))
                    sched_dt = datetime.datetime.combine(target_date, datetime.time(sched_hour, sched_min))
                    # 60 minute grace period
                    if now > (sched_dt + datetime.timedelta(minutes=60)):
                        status = "missed"
                except Exception:
                    pass
            elif target_date < datetime.date.today():
                status = "missed"

        items.append(TodayMedicationItem(
            schedule_id=sched.id,
            medication_id=med.id,
            name=med.name,
            dosage=med.dosage,
            instructions=med.instructions,
            scheduled_time=sched.scheduled_time,
            status=status,
            logged_time=logged_time,
            log_id=log_id
        ))

    # Sort chronologically by scheduled_time
    items.sort(key=lambda x: x.scheduled_time)
    return items


def find_next_medication(today_items: List[TodayMedicationItem]) -> Optional[TodayMedicationItem]:
    """Finds the next upcoming pending medication for today."""
    now_time = datetime.datetime.now().strftime("%H:%M")
    
    # First priority: pending medications with scheduled time >= now
    for item in today_items:
        if item.status == "pending" and item.scheduled_time >= now_time:
            return item

    # Second priority: any pending item remaining today
    for item in today_items:
        if item.status == "pending":
            return item

    return None
