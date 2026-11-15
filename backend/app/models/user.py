import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, default="elderly")  # elderly, caregiver, admin
    preferred_language = Column(String(10), default="en")  # en, bn
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    elderly_profile = relationship("ElderlyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    caregiver_links = relationship("CaregiverRelationship", foreign_keys="CaregiverRelationship.caregiver_id", back_populates="caregiver")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")
