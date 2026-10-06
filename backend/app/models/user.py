from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=True)
    age = Column(Integer, nullable=True)
    academic_year = Column(Integer, nullable=True)
    enrollment_no = Column(String, nullable=True)
    department = Column(String, nullable=True)
    semester = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    university = relationship("University")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete")
