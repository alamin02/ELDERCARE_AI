import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import Medication, Prescription

client = TestClient(app)


def get_auth_token():
    res = client.post("/api/v1/auth/login", json={
        "email": "elderly@eldercare.ai",
        "password": "ElderPass123!"
    })
    return res.json()["access_token"], res.json()["elderly_id"]


def upload_dummy_prescription(token, elderly_id):
    """Helper to upload a prescription image."""
    dummy_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")
    dummy_image.name = "test_prescription.png"

    response = client.post(
        "/api/v1/prescriptions/upload",
        files={"file": ("test_prescription.png", dummy_image, "image/png")},
        data={"elderly_id": str(elderly_id)},
        headers={"Authorization": f"Bearer {token}"}
    )
    return response


def test_prescription_upload_and_extraction():
    """Step 1 & 2: Upload prescription and receive structured candidates in pending_review status."""
    token, elderly_id = get_auth_token()
    response = upload_dummy_prescription(token, elderly_id)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending_review"
    assert "confidence_score" in data
    assert "extracted_medications" in data
    assert len(data["extracted_medications"]) > 0

    prescription_id = data["id"]
    db = SessionLocal()
    try:
        presc_record = db.query(Prescription).filter(Prescription.id == prescription_id).first()
        assert presc_record is not None
        assert presc_record.status == "pending_review"
    finally:
        db.close()


def test_prescription_human_review_gate_confirmation():
    """Step 3: Human Review Gate. Only explicitly confirmed candidates become active schedules."""
    token, elderly_id = get_auth_token()
    upload_res = upload_dummy_prescription(token, elderly_id)
    data = upload_res.json()
    presc_id = data["id"]
    candidates = data["extracted_medications"]

    # Confirm candidate with valid schedule
    reviewed_items = [
        {
            "name": candidates[0]["name"],
            "dosage": candidates[0]["dosage"],
            "frequency": candidates[0]["frequency"],
            "instructions": "Confirmed by patient",
            "scheduled_times": ["08:30"],
            "confirmed": True
        }
    ]

    review_res = client.post(
        f"/api/v1/prescriptions/{presc_id}/review",
        json={
            "confirmed_medications": reviewed_items,
            "decision": "confirmed",
            "notes": "Verified with prescribing physician"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["status"] == "confirmed"
    assert review_data["activated_medications_count"] == 1

    # Verify medicine is now active in medications table
    db = SessionLocal()
    try:
        activated_med = db.query(Medication).filter(
            Medication.elderly_id == elderly_id,
            Medication.name == candidates[0]["name"]
        ).first()
        assert activated_med is not None
        assert activated_med.is_active is True
    finally:
        db.close()


def test_prescription_rejection():
    """Verify rejected prescriptions do not activate any medications."""
    token, elderly_id = get_auth_token()
    upload_res = upload_dummy_prescription(token, elderly_id)
    presc_id = upload_res.json()["id"]

    review_res = client.post(
        f"/api/v1/prescriptions/{presc_id}/review",
        json={
            "confirmed_medications": [],
            "decision": "rejected",
            "notes": "Illegible prescription scan"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "rejected"
    assert review_res.json()["activated_medications_count"] == 0
