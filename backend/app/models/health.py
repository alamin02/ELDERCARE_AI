import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    record_type = Column(String(50), nullable=False)  # blood_pressure, blood_glucose, weight, heart_rate
    value_primary = Column(Float, nullable=False)  # e.g., Systolic (120) or Glucose (110) or Weight (68.5)
    value_secondary = Column(Float, nullable=True)  # e.g., Diastolic (80)
    unit = Column(String(20), nullable=False)  # mmHg, mg/dL, kg, bpm
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)  # e.g., "Fasting", "After breakfast"
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    elderly = relationship("ElderlyProfile", back_populates="health_records")
    recorded_by = relationship("User")
