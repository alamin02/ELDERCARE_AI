import datetime
from typing import Optional, List
from pydantic import BaseModel


class ElderlyProfileBase(BaseModel):
    date_of_birth: Optional[datetime.date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_medical_notes: Optional[str] = None
    primary_address: Optional[str] = None


class ElderlyProfileCreate(ElderlyProfileBase):
    user_id: int


class ElderlyProfileUpdate(ElderlyProfileBase):
    pass


class ElderlyProfileResponse(ElderlyProfileBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class TodayMedicationItem(BaseModel):
    schedule_id: int
    medication_id: int
    name: str
    dosage: str
    instructions: Optional[str] = None
    scheduled_time: str
    status: str  # pending, taken, skipped, missed
    logged_time: Optional[datetime.datetime] = None
    log_id: Optional[int] = None


class ElderlyDashboardSummary(BaseModel):
    elderly_id: int
    full_name: str
    preferred_language: str
    today_schedule: List[TodayMedicationItem]
    next_medication: Optional[TodayMedicationItem] = None
    taken_count: int
    missed_count: int
    pending_count: int
    latest_bp: Optional[str] = None
    latest_glucose: Optional[str] = None
    latest_weight: Optional[str] = None
    active_sos_event: Optional[int] = None
