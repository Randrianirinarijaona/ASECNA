from sqlalchemy import Column, String, Boolean, Enum, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('admin', 'technicien', 'user'), default='user')
    is_active = Column(Boolean, default=True)
    avatar_initials = Column(String(5))
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_login = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())