import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    channel: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
