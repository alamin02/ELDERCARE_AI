from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.security.rbac import get_current_user

router = APIRouter(prefix="/settings", tags=["User Settings"])


class UserSettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None  # en, bn


@router.put("/preferences")
def update_preferences(
    payload: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile preferences, including preferred language (EN / BN)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip()
    if payload.preferred_language is not None:
        lang = payload.preferred_language.lower().strip()
        if lang not in ["en", "bn"]:
            raise HTTPException(status_code=400, detail="Supported languages are 'en' (English) and 'bn' (Bengali)")
        current_user.preferred_language = lang

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Preferences updated successfully",
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "preferred_language": current_user.preferred_language
    }
