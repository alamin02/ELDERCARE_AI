import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # medication_reminder, missed_dose, emergency_sos
    is_read = Column(Boolean, default=False, nullable=False)
    channel = Column(String(50), default="in_app")  # in_app, sms_simulated
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    recipient = relationship("User", back_populates="notifications")
