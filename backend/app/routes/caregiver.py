import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User,
    ElderlyProfile,
    CaregiverRelationship,
    Medication,
    MedicationLog,
    HealthRecord,
    EmergencyEvent
)
from backend.app.schemas import (
    WardSummary,
    CaregiverLinkCreate,
    WardAdherenceResponse,
    AdherenceStatItem
)
from backend.app.security.rbac import get_current_user, require_roles
from backend.app.services.medication_service import get_today_medication_schedule

router = APIRouter(prefix="/caregiver", tags=["Caregiver Dashboard"])


@router.get("/wards", response_model=List[WardSummary])
def get_linked_wards(
    current_user: User = Depends(require_roles(["caregiver", "admin"])),
    db: Session = Depends(get_db)
):
    """List all authorized elderly patients linked to the caregiver with vital summaries."""
    links = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.is_active == True
    ).all()

    wards: List[WardSummary] = []
    for link in links:
        elderly = link.elderly
        if not elderly:
            continue

        today_items = get_today_medication_schedule(elderly.id, db)
        today_taken = sum(1 for item in today_items if item.status == "taken")
        today_missed = sum(1 for item in today_items if item.status == "missed")
        today_pending = sum(1 for item in today_items if item.status == "pending")
        total_today = len(today_items)
        adherence_pct = round((today_taken / total_today * 100), 1) if total_today > 0 else 100.0

        # Latest vitals
        latest_bp = db.query(HealthRecord).filter(
            HealthRecord.elderly_id == elderly.id,
            HealthRecord.record_type == "blood_pressure"
        ).order_by(HealthRecord.recorded_at.desc()).first()
        bp_str = f"{int(latest_bp.value_primary)}/{int(latest_bp.value_secondary or 0)} mmHg" if latest_bp else None

        latest_glucose = db.query(HealthRecord).filter(
            HealthRecord.elderly_id == elderly.id,
            HealthRecord.record_type == "blood_glucose"
        ).order_by(HealthRecord.recorded_at.desc()).first()
        glucose_str = f"{latest_glucose.value_primary} {latest_glucose.unit}" if latest_glucose else None

        # Active SOS
        active_emergency = db.query(EmergencyEvent).filter(
            EmergencyEvent.elderly_id == elderly.id,
            EmergencyEvent.status == "active"
        ).first()

        active_meds_count = db.query(Medication).filter(
            Medication.elderly_id == elderly.id,
            Medication.is_active == True
        ).count()

        wards.append(WardSummary(
            elderly_id=elderly.id,
            user_id=elderly.user.id,
            full_name=elderly.user.full_name,
            phone=elderly.user.phone,
            blood_group=elderly.blood_group,
            relationship_type=link.relationship_type,
            active_medications_count=active_meds_count,
            today_taken_count=today_taken,
            today_missed_count=today_missed,
            today_pending_count=today_pending,
            adherence_percentage=adherence_pct,
            latest_bp=bp_str,
            latest_glucose=glucose_str,
            has_active_emergency=active_emergency is not None
        ))

    return wards


@router.get("/wards/{elderly_id}/adherence", response_model=WardAdherenceResponse)
def get_ward_adherence(
    elderly_id: int,
    current_user: User = Depends(require_roles(["caregiver", "admin"])),
    db: Session = Depends(get_db)
):
    """Retrieve 7-day adherence trend data for an authorized elderly patient."""
    # Verify caregiver link
    link = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.elderly_id == elderly_id,
        CaregiverRelationship.is_active == True
    ).first()
    if not link and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to access this ward")

    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Elderly profile not found")

    today = datetime.date.today()
    history: List[AdherenceStatItem] = []
    total_taken = 0
    total_missed = 0
    total_scheduled = 0

    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_items = get_today_medication_schedule(elderly_id, db, target_date=day)

        d_taken = sum(1 for it in day_items if it.status == "taken")
        d_missed = sum(1 for it in day_items if it.status == "missed")
        d_skipped = sum(1 for it in day_items if it.status == "skipped")
        d_total = len(day_items)

        rate = round((d_taken / d_total * 100), 1) if d_total > 0 else 100.0
        history.append(AdherenceStatItem(
            date=day_str,
            taken=d_taken,
            missed=d_missed,
            skipped=d_skipped,
            adherence_rate=rate
        ))

        total_taken += d_taken
        total_missed += d_missed
        total_scheduled += d_total

    overall_rate = round((total_taken / total_scheduled * 100), 1) if total_scheduled > 0 else 100.0

    return WardAdherenceResponse(
        elderly_id=profile.id,
        elderly_name=profile.user.full_name,
        overall_adherence_rate=overall_rate,
        total_scheduled=total_scheduled,
        total_taken=total_taken,
        total_missed=total_missed,
        history_7_days=history
    )


@router.post("/link", status_code=status.HTTP_201_CREATED)
def link_elderly_ward(
    payload: CaregiverLinkCreate,
    current_user: User = Depends(require_roles(["caregiver", "admin"])),
    db: Session = Depends(get_db)
):
    """Link an elderly patient account using their registered email."""
    target_user = db.query(User).filter(User.email == payload.elderly_email.lower()).first()
    if not target_user or not target_user.elderly_profile:
        raise HTTPException(
            status_code=404,
            detail="No elderly patient account found with this email"
        )

    elderly_id = target_user.elderly_profile.id

    existing = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.elderly_id == elderly_id
    ).first()

    if existing:
        existing.is_active = True
        existing.relationship_type = payload.relationship_type
        existing.permissions = payload.permissions
    else:
        new_link = CaregiverRelationship(
            caregiver_id=current_user.id,
            elderly_id=elderly_id,
            relationship_type=payload.relationship_type,
            is_active=True,
            permissions=payload.permissions
        )
        db.add(new_link)

    db.commit()
    return {"message": f"Successfully linked {target_user.full_name} as your ward"}
