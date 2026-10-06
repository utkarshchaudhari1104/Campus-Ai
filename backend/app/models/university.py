from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from app.core.database import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    official_email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    website = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)