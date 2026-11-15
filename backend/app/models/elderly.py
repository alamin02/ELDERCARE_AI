import datetime
from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class ElderlyProfile(Base):
    __tablename__ = "elderly_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_medical_notes = Column(Text, nullable=True)  # Allergies, chronic conditions
    primary_address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="elderly_profile")
    caregivers = relationship("CaregiverRelationship", foreign_keys="CaregiverRelationship.elderly_id", back_populates="elderly")
    medications = relationship("Medication", back_populates="elderly", cascade="all, delete-orphan")
    schedules = relationship("MedicationSchedule", back_populates="elderly", cascade="all, delete-orphan")
    medication_logs = relationship("MedicationLog", back_populates="elderly", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="elderly", cascade="all, delete-orphan")
    health_records = relationship("HealthRecord", back_populates="elderly", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="elderly", cascade="all, delete-orphan")
    emergency_events = relationship("EmergencyEvent", back_populates="elderly", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="elderly", cascade="all, delete-orphan")
