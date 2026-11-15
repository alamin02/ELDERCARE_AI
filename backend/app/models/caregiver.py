import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class CaregiverRelationship(Base):
    __tablename__ = "caregiver_relationships"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    elderly_id = Column(Integer, ForeignKey("elderly_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False, default="Family Caregiver")  # daughter, son, doctor, nurse
    is_active = Column(Boolean, default=True, nullable=False)
    permissions = Column(String(255), default="view,edit_meds,emergency_alerts")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    caregiver = relationship("User", foreign_keys=[caregiver_id], back_populates="caregiver_links")
    elderly = relationship("ElderlyProfile", foreign_keys=[elderly_id], back_populates="caregivers")
