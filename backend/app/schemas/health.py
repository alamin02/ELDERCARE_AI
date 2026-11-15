import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class HealthRecordBase(BaseModel):
    record_type: str = Field(..., description="blood_pressure, blood_glucose, weight, heart_rate")
    value_primary: float = Field(..., description="Primary metric (e.g. Systolic or Glucose)")
    value_secondary: Optional[float] = Field(None, description="Secondary metric (e.g. Diastolic)")
    unit: str = Field(..., description="mmHg, mg/dL, kg, bpm")
    recorded_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    notes: Optional[str] = None


class HealthRecordCreate(HealthRecordBase):
    elderly_id: Optional[int] = None


class HealthRecordResponse(HealthRecordBase):
    id: int
    elderly_id: int
    recorded_by_id: Optional[int]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class HealthSummaryResponse(BaseModel):
    latest_bp: Optional[HealthRecordResponse] = None
    latest_glucose: Optional[HealthRecordResponse] = None
    latest_weight: Optional[HealthRecordResponse] = None
    history: List[HealthRecordResponse] = []
