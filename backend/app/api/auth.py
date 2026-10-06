from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.models.university import University

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    university_id: int
    age: int = Field(ge=13, le=100)
    academic_year: int = Field(ge=1, le=8)
    enrollment_no: Optional[str] = None
    department: str = Field(min_length=2, max_length=100)
    semester: Optional[int] = None


class UniversityRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    location: str = Field(min_length=2, max_length=150)
    address: str = Field(min_length=5, max_length=500)
    official_email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    website: Optional[str] = None
    contact_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    enrollment_no: Optional[str] = None


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email = str(req.email).lower()
    if db.query(User).filter(User.email.ilike(email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    university = db.query(University).filter(
        University.id == req.university_id,
        University.is_active == True,
    ).first()
    if not university:
        raise HTTPException(status_code=400, detail="Choose a registered university")

    user = User(
        name=req.name,
        email=email,
        password_hash=hash_password(req.password),
        role="student",
        university_id=university.id,
        age=req.age,
        academic_year=req.academic_year,
        enrollment_no=req.enrollment_no,
        department=req.department,
        semester=req.semester
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.post("/register/university")
def register_university(req: UniversityRegisterRequest, db: Session = Depends(get_db)):
    university_name = " ".join(req.name.split())
    existing_university = db.query(University).filter(
        func.lower(func.trim(University.name)) == university_name.lower()
    ).first()
    if existing_university:
        raise HTTPException(status_code=400, detail="A university with this name is already registered")

    email = str(req.official_email).lower()
    if db.query(User).filter(User.email.ilike(email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    university = University(
        name=university_name,
        location=req.location.strip(),
        address=req.address.strip(),
        official_email=email,
        phone=req.phone.strip(),
        website=req.website.strip() if req.website else None,
    )
    db.add(university)
    db.flush()

    user = User(
        name=req.contact_name.strip(),
        email=email,
        password_hash=hash_password(req.password),
        role="university_admin",
        university_id=university.id,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A university with this name or email is already registered",
        ) from exc
    db.refresh(user)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.get("/universities")
def list_universities(db: Session = Depends(get_db)):
    universities = db.query(University).filter(
        University.is_active == True
    ).order_by(University.name.asc()).all()
    return [
        {"id": university.id, "name": university.name, "location": university.location}
        for university in universities
    ]


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(form.username)).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account is blocked. Contact your university administrator.")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.put("/me")
def update_profile(req: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.name:
        current_user.name = req.name
    if req.department:
        current_user.department = req.department
    if req.semester:
        current_user.semester = req.semester
    if req.enrollment_no:
        current_user.enrollment_no = req.enrollment_no
    db.commit()
    db.refresh(current_user)
    return _user_dict(current_user)


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "university_id": user.university_id,
        "university_name": user.university.name if user.university else None,
        "age": user.age,
        "academic_year": user.academic_year,
        "enrollment_no": user.enrollment_no,
        "department": user.department,
        "semester": user.semester,
        "created_at": user.created_at.isoformat()
    }
