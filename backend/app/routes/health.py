import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, HealthRecord
from backend.app.schemas import (
    HealthRecordCreate,
    HealthRecordResponse,
    HealthSummaryResponse
)
from backend.app.security.rbac import get_current_user, verify_and_resolve_elderly_id

router = APIRouter(prefix="/health", tags=["Health Records"])


@router.get("", response_model=List[HealthRecordResponse])
def list_health_records(
    elderly_id: Optional[int] = Query(None),
    record_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical health records. Informational only, not a clinical diagnosis."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    query = db.query(HealthRecord).filter(HealthRecord.elderly_id == resolved_id)
    if record_type:
        query = query.filter(HealthRecord.record_type == record_type)
    records = query.order_by(HealthRecord.recorded_at.desc()).limit(limit).all()
    return records


@router.post("", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
def create_health_record(
    payload: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a health measurement (Blood Pressure, Glucose, Weight)."""
    resolved_id = verify_and_resolve_elderly_id(payload.elderly_id, current_user, db)

    valid_types = ["blood_pressure", "blood_glucose", "weight", "heart_rate"]
    if payload.record_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid record type. Must be one of: {valid_types}"
        )

    new_record = HealthRecord(
        elderly_id=resolved_id,
        record_type=payload.record_type,
        value_primary=payload.value_primary,
        value_secondary=payload.value_secondary,
        unit=payload.unit,
        recorded_at=payload.recorded_at or datetime.datetime.utcnow(),
        notes=payload.notes,
        recorded_by_id=current_user.id
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/summary", response_model=HealthSummaryResponse)
def get_health_summary(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns latest vitals along with recent trend history."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)

    bp = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id,
        HealthRecord.record_type == "blood_pressure"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    glucose = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id,
        HealthRecord.record_type == "blood_glucose"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    weight = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id,
        HealthRecord.record_type == "weight"
    ).order_by(HealthRecord.recorded_at.desc()).first()

    history = db.query(HealthRecord).filter(
        HealthRecord.elderly_id == resolved_id
    ).order_by(HealthRecord.recorded_at.desc()).limit(30).all()

    return HealthSummaryResponse(
        latest_bp=HealthRecordResponse.from_orm(bp) if bp else None,
        latest_glucose=HealthRecordResponse.from_orm(glucose) if glucose else None,
        latest_weight=HealthRecordResponse.from_orm(weight) if weight else None,
        history=[HealthRecordResponse.from_orm(h) for h in history]
    )
