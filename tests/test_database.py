import pytest
from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    User,
    ElderlyProfile,
    CaregiverRelationship,
    Medication,
    MedicationSchedule,
    MedicationLog,
    HealthRecord,
    EmergencyContact,
    EmergencyEvent,
    Prescription,
    Notification,
    Conversation
)
from backend.app.security import verify_password, get_password_hash


def test_models_metadata_registration():
    """Verify all 12 required tables are registered with SQLAlchemy metadata."""
    expected_tables = {
        "users",
        "elderly_profiles",
        "caregiver_relationships",
        "medications",
        "medication_schedules",
        "medication_logs",
        "prescriptions",
        "health_records",
        "emergency_contacts",
        "emergency_events",
        "notifications",
        "conversations"
    }
    registered_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(registered_tables), f"Missing tables: {expected_tables - registered_tables}"


def test_password_hashing():
    """Verify password hashing and verification logic."""
    raw_password = "SecurePassword123!"
    hashed = get_password_hash(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_seeded_data_retrieval():
    """Verify that seeded data can be retrieved and relational navigation works."""
    db = SessionLocal()
    try:
        elderly_user = db.query(User).filter(User.email == "elderly@eldercare.ai").first()
        assert elderly_user is not None
        assert elderly_user.role == "elderly"
        assert verify_password("ElderPass123!", elderly_user.password_hash) is True

        profile = elderly_user.elderly_profile
        assert profile is not None
        assert profile.blood_group == "O+"

        # Verify medications
        meds = db.query(Medication).filter(Medication.elderly_id == profile.id).all()
        assert len(meds) >= 3
        med_names = [m.name for m in meds]
        assert "Metformin" in med_names
        assert "Amlodipine" in med_names

        # Verify caregiver link
        caregiver_user = db.query(User).filter(User.email == "caregiver@eldercare.ai").first()
        assert caregiver_user is not None
        assert caregiver_user.role == "caregiver"

        caregiver_rel = db.query(CaregiverRelationship).filter(
            CaregiverRelationship.caregiver_id == caregiver_user.id,
            CaregiverRelationship.elderly_id == profile.id
        ).first()
        assert caregiver_rel is not None
        assert caregiver_rel.relationship_type == "Daughter"

        # Verify emergency contacts
        contacts = db.query(EmergencyContact).filter(EmergencyContact.elderly_id == profile.id).all()
        assert len(contacts) >= 3
        primary_contact = next((c for c in contacts if c.is_primary), None)
        assert primary_contact is not None
        assert primary_contact.name == "Farhana Rahman"
    finally:
        db.close()
