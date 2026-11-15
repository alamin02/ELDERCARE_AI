from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, ElderlyProfile, CaregiverRelationship
from backend.app.security.jwt import decode_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate the currently authenticated user from Bearer JWT."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user_id",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(allowed_roles: List[str]):
    """Enforce role-based access control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{current_user.role}' not permitted. Required: {allowed_roles}"
            )
        return current_user
    return role_checker


def verify_and_resolve_elderly_id(
    target_elderly_id: Optional[int],
    current_user: User,
    db: Session
) -> int:
    """
    CRITICAL HEALTHCARE RBAC:
    Resolves and strictly verifies authorization to access an elderly profile.
    - If user is elderly: target must match their own profile ID.
    - If user is caregiver: target must have an active relationship record.
    - If user is admin: allowed access to any valid elderly ID.
    - Frontend-supplied IDs are NEVER trusted blindly.
    """
    if current_user.role == "elderly":
        profile = db.query(ElderlyProfile).filter(ElderlyProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Elderly profile not found for this account"
            )
        if target_elderly_id is not None and target_elderly_id != profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Elderly patients are strictly restricted to their own medical profile"
            )
        return profile.id

    elif current_user.role == "caregiver":
        if target_elderly_id is None:
            # If no target specified, attempt to resolve first active linked ward
            first_link = db.query(CaregiverRelationship).filter(
                CaregiverRelationship.caregiver_id == current_user.id,
                CaregiverRelationship.is_active == True
            ).first()
            if not first_link:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Caregiver has no active linked elderly wards"
                )
            return first_link.elderly_id

        # Verify caregiver is explicitly authorized for this ward
        has_permission = db.query(CaregiverRelationship).filter(
            CaregiverRelationship.caregiver_id == current_user.id,
            CaregiverRelationship.elderly_id == target_elderly_id,
            CaregiverRelationship.is_active == True
        ).first()

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not authorized to access this patient's records"
            )
        return target_elderly_id

    elif current_user.role == "admin":
        if target_elderly_id is not None:
            profile = db.query(ElderlyProfile).filter(ElderlyProfile.id == target_elderly_id).first()
            if not profile:
                raise HTTPException(status_code=404, detail="Elderly profile not found")
            return profile.id
        first_profile = db.query(ElderlyProfile).first()
        if not first_profile:
            raise HTTPException(status_code=404, detail="No elderly profiles in system")
        return first_profile.id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized user role"
    )
