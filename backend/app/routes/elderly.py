import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User,
    ElderlyProfile,
    HealthRecord,
    EmergencyEvent
)
from backend.app.schemas import (
    ElderlyProfileResponse,
    ElderlyProfileUpdate,
    ElderlyDashboardSummary
)
from backend.app.security.rbac import get_current_user, verify_and_resolve_elderly_id
from backend.app.services.medication_service import (
    get_today_medication_schedule,
    find_next_medication
)

router = APIRouter(prefix="/elderly", tags=["Elderly Patient"])


@router.get("/profile", response_model=ElderlyProfileResponse)
def get_elderly_profile(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve elderly profile. Strictly authorized via RBAC."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == resolved_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Elderly profile not found")
    return profile


@router.put("/profile", response_model=ElderlyProfileResponse)
def update_elderly_profile(
    payload: ElderlyProfileUpdate,
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile details (allergies, medical notes, address)."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == resolved_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Elderly profile not found")

    if payload.date_of_birth is not None:
        profile.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        profile.gender = payload.gender
    if payload.blood_group is not None:
        profile.blood_group = payload.blood_group
    if payload.emergency_medical_notes is not None:
        profile.emergency_medical_notes = payload.emergency_medical_notes
    if payload.primary_address is not None:
        profile.primary_address = payload.primary_address

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/dashboard-summary", response_model=ElderlyDashboardSummary)
def get_dashboard_summary(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the comprehensive accessible elderly dashboard summary:
    - Welcome message & patient info
    - Today's medication schedule
    - Next medicine reminder
    - Taken, missed, and pending dose counters
    - Latest vitals (BP, Blood Glucose, Weight)
    - Active SOS event indicator
    """
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == resolved_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Elderly profile not found")

    today_items = get_today_medication_schedule(resolved_id, db)
    next_med = find_next_medication(today_items)

    taken_count = sum(1 for item in today_items if item.status == "taken")
    missed_count = sum(1 for item in today_items if item.status == "missed")
    pending_count = sum(1 for item in today_items if item.status == "pending")

    # Fetch latest vitals
    latest_bp_rec = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id,
        HealthRecord.record_type == "blood_pressure"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    latest_bp_str = f"{int(latest_bp_rec.value_primary)}/{int(latest_bp_rec.value_secondary or 0)} mmHg" if latest_bp_rec else None

    latest_glucose_rec = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id,
        HealthRecord.record_type == "blood_glucose"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    latest_glucose_str = f"{latest_glucose_rec.value_primary} {latest_glucose_rec.unit}" if latest_glucose_rec else None

    latest_weight_rec = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id,
        HealthRecord.record_type == "weight"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    latest_weight_str = f"{latest_weight_rec.value_primary} kg" if latest_weight_rec else None

    # Check for active SOS event
    active_sos = db.query(EmergencyEvent).filter(
        EmergencyEvent.elderly_id == resolved_id,
        EmergencyEvent.status == "active"
    ).first()

    return ElderlyDashboardSummary(
        elderly_id=profile.id,
        full_name=profile.user.full_name,
        preferred_language=profile.user.preferred_language,
        today_schedule=today_items,
        next_medication=next_med,
        taken_count=taken_count,
        missed_count=missed_count,
        pending_count=pending_count,
        latest_bp=latest_bp_str,
        latest_glucose=latest_glucose_str,
        latest_weight=latest_weight_str,
        active_sos_event=active_sos.id if active_sos else None
    )
