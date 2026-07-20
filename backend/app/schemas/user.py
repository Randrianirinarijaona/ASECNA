from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "user"

class UserRead(UserBase):
    id: str
    role: str
    is_active: bool
    avatar_initials: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True