import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ScheduleBase(BaseModel):
    scheduled_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format, 24-hour")
    day_of_week: str = "daily"


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleResponse(ScheduleBase):
    id: int
    medication_id: int
    elderly_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class MedicationBase(BaseModel):
    name: str = Field(..., min_length=1)
    dosage: str = Field(..., min_length=1)
    frequency: str = Field(..., min_length=1)
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    start_date: datetime.date = Field(default_factory=datetime.date.today)
    end_date: Optional[datetime.date] = None
    is_active: bool = True


class MedicationCreate(MedicationBase):
    elderly_id: Optional[int] = None  # Inferred from token if elderly, required if caregiver
    schedules: List[ScheduleCreate] = []


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    is_active: Optional[bool] = None
    schedules: Optional[List[ScheduleCreate]] = None


class MedicationResponse(MedicationBase):
    id: int
    elderly_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    schedules: List[ScheduleResponse] = []

    class Config:
        from_attributes = True


class MedicationLogCreate(BaseModel):
    schedule_id: Optional[int] = None
    medication_id: int
    elderly_id: Optional[int] = None
    scheduled_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    status: str = Field(..., pattern="^(taken|skipped|missed)$")
    notes: Optional[str] = None


class MedicationLogResponse(BaseModel):
    id: int
    schedule_id: Optional[int]
    medication_id: int
    elderly_id: int
    scheduled_time: str
    actual_time: Optional[datetime.datetime]
    status: str
    notes: Optional[str]
    marked_by_id: Optional[int]
    created_at: datetime.datetime
    medication_name: Optional[str] = None

    class Config:
        from_attributes = True
