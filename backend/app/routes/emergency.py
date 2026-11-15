import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User,
    EmergencyContact,
    EmergencyEvent,
    Notification
)
from backend.app.schemas import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    SOSTriggerRequest,
    EmergencyEventResponse,
    NotificationResponse
)
from backend.app.security.rbac import get_current_user, verify_and_resolve_elderly_id
from backend.app.services.emergency_service import trigger_emergency_sos

router = APIRouter(prefix="/emergency", tags=["Emergency SOS & Contacts"])


@router.get("/contacts", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List emergency contacts for elderly patient."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.elderly_id == resolved_id
    ).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.created_at.asc()).all()
    return contacts


@router.post("/contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    payload: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new emergency contact."""
    resolved_id = verify_and_resolve_elderly_id(payload.elderly_id, current_user, db)

    # If marked as primary, unmark existing primary contacts
    if payload.is_primary:
        db.query(EmergencyContact).filter(
            EmergencyContact.elderly_id == resolved_id,
            EmergencyContact.is_primary == True
        ).update({"is_primary": False})

    contact = EmergencyContact(
        elderly_id=resolved_id,
        name=payload.name.strip(),
        relationship_type=payload.relationship_type.strip(),
        phone_number=payload.phone_number.strip(),
        is_primary=payload.is_primary
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_contact(
    contact_id: int,
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an emergency contact."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.elderly_id == resolved_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return None


@router.post("/sos")
def trigger_sos(
    payload: SOSTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger one-tap Emergency SOS.
    Dispatches alerts to caregivers and primary contacts.
    If real SMS gateway is not configured, explicitly returns simulated status.
    """
    resolved_id = verify_and_resolve_elderly_id(payload.elderly_id, current_user, db)
    result = trigger_emergency_sos(
        elderly_id=resolved_id,
        triggered_by_id=current_user.id,
        notes=payload.notes or "One-Tap Emergency SOS triggered",
        db=db
    )
    return result


@router.post("/resolve/{event_id}")
def resolve_emergency(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an active emergency event as resolved."""
    event = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Emergency event not found")

    # Authorize user has access to this elderly
    verify_and_resolve_elderly_id(event.elderly_id, current_user, db)

    event.status = "resolved"
    event.resolved_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Emergency marked as resolved", "event_id": event_id}


@router.get("/events", response_model=List[EmergencyEventResponse])
def get_emergency_events(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List historical emergency events."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)
    events = db.query(EmergencyEvent).filter(
        EmergencyEvent.elderly_id == resolved_id
    ).order_by(EmergencyEvent.created_at.desc()).all()

    resp = []
    for ev in events:
        item = EmergencyEventResponse.from_orm(ev)
        if ev.elderly and ev.elderly.user:
            item.elderly_name = ev.elderly.user.full_name
        resp.append(item)
    return resp


@router.get("/notifications", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve notifications for the authenticated user."""
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    return notifs
