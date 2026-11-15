import datetime
from typing import Optional, List
from pydantic import BaseModel


class WardSummary(BaseModel):
    elderly_id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    relationship_type: str
    active_medications_count: int
    today_taken_count: int
    today_missed_count: int
    today_pending_count: int
    adherence_percentage: float
    latest_bp: Optional[str] = None
    latest_glucose: Optional[str] = None
    has_active_emergency: bool


class CaregiverLinkCreate(BaseModel):
    elderly_email: str
    relationship_type: str = "Family Member"
    permissions: str = "view,edit_meds,emergency_alerts"


class AdherenceStatItem(BaseModel):
    date: str
    taken: int
    missed: int
    skipped: int
    adherence_rate: float


class WardAdherenceResponse(BaseModel):
    elderly_id: int
    elderly_name: str
    overall_adherence_rate: float
    total_scheduled: int
    total_taken: int
    total_missed: int
    history_7_days: List[AdherenceStatItem] = []
