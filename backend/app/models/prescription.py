import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    ocr_raw_text = Column(Text, nullable=True)
    ai_extracted_data = Column(JSON, nullable=True)  # Structured list of medications extracted
    status = Column(String(30), default="pending_review", nullable=False)  # pending_review, confirmed, rejected
    confidence_score = Column(Float, default=0.0)
    uncertain_fields = Column(JSON, nullable=True)  # List of fields requiring user clarification
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    elderly = relationship("ElderlyProfile", back_populates="prescriptions")
    reviewed_by = relationship("User")
