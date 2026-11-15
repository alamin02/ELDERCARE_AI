import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from backend.app.database import Base


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    relationship_type = Column("relationship", String(50), nullable=False)  # Daughter, Son, Doctor, Neighbor
    phone_number = Column(String(50), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    elderly = orm_relationship("ElderlyProfile", back_populates="emergency_contacts")


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String(50), nullable=False, default="sos_button")  # sos_button, missed_critical_med
    status = Column(String(30), nullable=False, default="active")  # active, acknowledged, resolved
    notification_status = Column(String(50), default="simulated_sent")  # simulated_sent, delivered, failed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    elderly = orm_relationship("ElderlyProfile", back_populates="emergency_events")
    triggered_by = orm_relationship("User")
