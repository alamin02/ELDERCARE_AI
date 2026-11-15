from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class StructuredMedicationItem(BaseModel):
    name: str
    dosage: str
    scheduled_time: Optional[str] = None
    status: Optional[str] = None  # pending, taken, missed, etc.


class ChatQueryRequest(BaseModel):
    message: str = Field(..., min_length=1)
    elderly_id: Optional[int] = None
    session_id: Optional[str] = "default-session"
    language: Optional[str] = None  # en or bn (if None, auto-detected or user profile default)


class ChatQueryResponse(BaseModel):
    intent: str = Field(..., description="next_medication | missed_check | daily_schedule | forgot_dose_advice | notify_caregiver | history_query | emergency | general_query")
    response: str = Field(..., description="Compassionate, accessible response in English or Bengali")
    relevant_medications: List[StructuredMedicationItem] = []
    recommended_action: Optional[str] = None
    requires_caregiver: bool = False
    safety_warning: Optional[str] = None
    language: str = "en"
    ai_provider: str = "gemini"  # "gemini_2.5_flash" or "deterministic_fallback"


class ConversationHistoryItem(BaseModel):
    id: int
    role: str
    message: str
    structured_data: Optional[Dict[str, Any]] = None
    created_at: str
