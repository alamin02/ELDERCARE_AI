import datetime
from sqlalchemy import Column, Integer, String, Date, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)  # e.g., "500 mg", "1 tablet"
    frequency = Column(String(100), nullable=False)  # e.g., "Once daily", "Twice daily", "Every 8 hours"
    instructions = Column(Text, nullable=True)  # e.g., "Take after meals with warm water"
    prescribing_doctor = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=False, default=datetime.date.today)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    elderly = relationship("ElderlyProfile", back_populates="medications")
    schedules = relationship("MedicationSchedule", back_populates="medication", cascade="all, delete-orphan")
    logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_time = Column(String(10), nullable=False)  # "08:00", "13:00", "20:00" in 24hr format
    day_of_week = Column(String(50), default="daily")  # "daily" or comma-separated "mon,tue,wed..."
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    medication = relationship("Medication", back_populates="schedules")
    elderly = relationship("ElderlyProfile", back_populates="schedules")
    logs = relationship("MedicationLog", back_populates="schedule")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id", ondelete="SET NULL"), nullable=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_time = Column(String(10), nullable=False)  # "08:00"
    actual_time = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="taken")  # taken, skipped, missed
    notes = Column(Text, nullable=True)
    marked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    medication = relationship("Medication", back_populates="logs")
    schedule = relationship("MedicationSchedule", back_populates="logs")
    elderly = relationship("ElderlyProfile", back_populates="medication_logs")
    marked_by = relationship("User")
