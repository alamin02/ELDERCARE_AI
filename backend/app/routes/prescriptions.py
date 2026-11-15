import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User,
    Prescription,
    Medication,
    MedicationSchedule
)
from backend.app.schemas import (
    PrescriptionUploadResponse,
    PrescriptionReviewRequest,
    PrescriptionResponse
)
from backend.app.security.rbac import get_current_user, verify_and_resolve_elderly_id
from backend.app.services.ocr_service import extract_text_from_image
from backend.app.ai.prescription_extractor import extract_prescription_data

router = APIRouter(prefix="/prescriptions", tags=["Prescription OCR & Extraction"])

UPLOAD_DIR = os.path.join("backend", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=PrescriptionUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    file: UploadFile = File(...),
    elderly_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1 & 2: User uploads prescription. OCR extracts text.
    Gemini / Deterministic AI extracts structured medication candidates.
    Returns preview with confidence score and uncertain fields.
    Held in 'pending_review' - NOT active schedules until explicitly confirmed!
    """
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)

    # Save file safely
    file_ext = os.path.splitext(file.filename or "prescription.jpg")[1]
    safe_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    contents = await file.read()
    with open(saved_path, "wb") as f:
        f.write(contents)

    # Run OCR
    raw_text, ocr_conf = extract_text_from_image(saved_path)

    # Run AI extraction
    extracted_meds, overall_conf, uncertain_fields = await extract_prescription_data(raw_text)

    # Persist prescription record
    prescription = Prescription(
        elderly_id=resolved_id,
        file_path=saved_path,
        ocr_raw_text=raw_text,
        ai_extracted_data=[m.dict() for m in extracted_meds],
        status="pending_review",
        confidence_score=overall_conf,
        uncertain_fields=uncertain_fields,
        created_at=datetime.datetime.utcnow()
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return PrescriptionUploadResponse(
        id=prescription.id,
        elderly_id=resolved_id,
        file_path=saved_path,
        ocr_raw_text=raw_text,
        extracted_medications=extracted_meds,
        confidence_score=overall_conf,
        uncertain_fields=uncertain_fields,
        status=prescription.status,
        created_at=prescription.created_at
    )


@router.post("/{prescription_id}/review")
def review_and_confirm_prescription(
    prescription_id: int,
    payload: PrescriptionReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 3: Human Review Gate.
    Elderly patient or authorized caregiver confirms extracted medication candidates.
    ONLY confirmed items become active medications and schedules in the database.
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Authorize access
    verify_and_resolve_elderly_id(prescription.elderly_id, current_user, db)

    decision = payload.decision.lower().strip()
    if decision not in ["confirmed", "rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'confirmed' or 'rejected'")

    prescription.status = decision
    prescription.reviewed_by_id = current_user.id
    prescription.reviewed_at = datetime.datetime.utcnow()

    added_meds_count = 0
    if decision == "confirmed":
        today = datetime.date.today()
        for item in payload.confirmed_medications:
            if not item.confirmed:
                continue

            # Add to active medications
            new_med = Medication(
                elderly_id=prescription.elderly_id,
                name=item.name.strip(),
                dosage=item.dosage.strip(),
                frequency=item.frequency.strip(),
                instructions=item.instructions,
                prescribing_doctor=item.prescribing_doctor,
                start_date=today,
                is_active=True
            )
            db.add(new_med)
            db.flush()

            # Add schedules
            for time_str in item.scheduled_times:
                sched = MedicationSchedule(
                    medication_id=new_med.id,
                    elderly_id=prescription.elderly_id,
                    scheduled_time=time_str,
                    day_of_week="daily"
                )
                db.add(sched)

            added_meds_count += 1

    db.commit()

    return {
        "message": f"Prescription {decision}. {added_meds_count} medications activated to schedule.",
        "status": decision,
        "activated_medications_count": added_meds_count
    }


@router.get("", response_model=List[PrescriptionResponse])
def list_prescriptions(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List uploaded prescriptions."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    return db.query(Prescription).filter(
        Prescription.elderly_id == resolved_id
    ).order_by(Prescription.created_at.desc()).all()
