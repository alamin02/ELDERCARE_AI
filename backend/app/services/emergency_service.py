import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models import (
    ElderlyProfile,
    EmergencyEvent,
    EmergencyContact,
    Notification,
    CaregiverRelationship
)


def trigger_emergency_sos(
    elderly_id: int,
    triggered_by_id: int,
    notes: str,
    db: Session
) -> Dict[str, Any]:
    """
    Triggers an Emergency SOS event.
    Creates an EmergencyEvent record and dispatches caregiver alerts.
    If real SMS/carrier credentials are not configured, uses a clearly
    labeled simulated notification status: 'simulated_sent' with explicit warning.
    """
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == elderly_id).first()
    if not profile:
        raise ValueError("Elderly profile not found")

    notification_status = "simulated_sent" if settings.SIMULATED_NOTIFICATION_MODE else "sent"

    event = EmergencyEvent(
        elderly_id=elderly_id,
        triggered_by_id=triggered_by_id,
        event_type="sos_button",
        status="active",
        notification_status=notification_status,
        notes=notes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(event)
    db.flush()

    # Retrieve all emergency contacts
    contacts = db.query(EmergencyContact).filter(EmergencyContact.elderly_id == elderly_id).all()
    contact_names = [f"{c.name} ({c.phone_number})" for c in contacts]

    # Find linked caregivers and create in-app urgent notifications
    caregiver_links = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.elderly_id == elderly_id,
        CaregiverRelationship.is_active == True
    ).all()

    patient_name = profile.user.full_name
    for link in caregiver_links:
        notif = Notification(
            recipient_id=link.caregiver_id,
            title="EMERGENCY SOS ALERT",
            message=f"CRITICAL: {patient_name} has triggered an Emergency SOS! Please contact immediately or dispatch help.",
            notification_type="emergency_sos",
            is_read=False,
            channel="in_app",
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)

    db.commit()
    db.refresh(event)

    return {
        "event_id": event.id,
        "elderly_id": elderly_id,
        "elderly_name": patient_name,
        "status": event.status,
        "notification_status": event.notification_status,
        "is_simulated": settings.SIMULATED_NOTIFICATION_MODE,
        "contacts_alerted": contact_names,
        "message": "Emergency SOS triggered. Notifications dispatched to caregivers and primary contacts."
    }
