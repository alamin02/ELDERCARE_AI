from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, ElderlyProfile
from backend.app.schemas import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse
)
from backend.app.security import (
    verify_password,
    get_password_hash,
    create_access_token
)
from backend.app.security.rbac import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (elderly patient, caregiver, or admin)."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Validate role
    role = payload.role.lower().strip()
    if role not in ["elderly", "caregiver", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be one of: 'elderly', 'caregiver', 'admin'"
        )

    new_user = User(
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=role,
        preferred_language=payload.preferred_language or "en"
    )
    db.add(new_user)
    db.flush()

    elderly_id = None
    if role == "elderly":
        profile = ElderlyProfile(
            user_id=new_user.id,
            gender=payload.gender,
            blood_group=payload.blood_group,
            emergency_medical_notes=payload.emergency_medical_notes,
            primary_address=payload.primary_address
        )
        db.add(profile)
        db.flush()
        elderly_id = profile.id

    db.commit()

    token_data = {
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "elderly_id": elderly_id
    }
    token = create_access_token(token_data)

    return Token(
        access_token=token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        full_name=new_user.full_name,
        elderly_id=elderly_id,
        preferred_language=new_user.preferred_language
    )


@router.post("/login", response_model=Token)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    elderly_id = None
    if user.elderly_profile:
        elderly_id = user.elderly_profile.id

    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "elderly_id": elderly_id
    }
    token = create_access_token(token_data)

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        elderly_id=elderly_id,
        preferred_language=user.preferred_language
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details of the currently authenticated user."""
    elderly_id = None
    if current_user.elderly_profile:
        elderly_id = current_user.elderly_profile.id

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        preferred_language=current_user.preferred_language,
        elderly_id=elderly_id
    )
