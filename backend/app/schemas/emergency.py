import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class EmergencyContactBase(BaseModel):
    name: str = Field(..., min_length=2)
    relationship_type: str = Field(..., min_length=2)
    phone_number: str = Field(..., min_length=3)
    is_primary: bool = False


class EmergencyContactCreate(EmergencyContactBase):
    elderly_id: Optional[int] = None


class EmergencyContactResponse(EmergencyContactBase):
    id: int
    elderly_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class SOSTriggerRequest(BaseModel):
    elderly_id: Optional[int] = None
    notes: Optional[str] = "Emergency SOS button triggered by user"


class EmergencyEventResponse(BaseModel):
    id: int
    elderly_id: int
    triggered_by_id: Optional[int]
    event_type: str
    status: str
    notification_status: str
    notes: Optional[str]
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime]
    elderly_name: Optional[str] = None
    contacts_alerted: List[str] = []

    class Config:
        from_attributes = True
