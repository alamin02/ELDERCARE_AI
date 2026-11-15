import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class PrescriptionExtractedMed(BaseModel):
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    suggested_times: List[str] = []
    confidence: float = 0.9
    is_uncertain: bool = False
    uncertainty_reason: Optional[str] = None


class PrescriptionUploadResponse(BaseModel):
    id: int
    elderly_id: int
    file_path: str
    ocr_raw_text: Optional[str] = None
    extracted_medications: List[PrescriptionExtractedMed] = []
    confidence_score: float
    uncertain_fields: List[str] = []
    status: str
    created_at: datetime.datetime


class PrescriptionReviewItem(BaseModel):
    name: str = Field(..., min_length=1)
    dosage: str = Field(..., min_length=1)
    frequency: str = Field(..., min_length=1)
    instructions: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    scheduled_times: List[str] = ["08:00"]
    confirmed: bool = True


class PrescriptionReviewRequest(BaseModel):
    confirmed_medications: List[PrescriptionReviewItem]
    decision: str = Field(..., description="confirmed or rejected")
    notes: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: int
    elderly_id: int
    file_path: str
    status: str
    confidence_score: float
    ocr_raw_text: Optional[str]
    ai_extracted_data: Optional[Any]
    uncertain_fields: Optional[Any]
    reviewed_by_id: Optional[int]
    reviewed_at: Optional[datetime.datetime]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
