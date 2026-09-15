from datetime import datetime
from typing import Optional
from app.models.user import RoleEnum
from app.schemas.base import CamelModel


class UserOut(CamelModel):
    id: str
    username: str
    email: Optional[str] = None
    role: RoleEnum
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    avatar_initials: Optional[str] = None


class UserUpdate(CamelModel):
    username: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[RoleEnum] = None


class LoginPayload(CamelModel):
    username: str
    password: str


class RegisterPayload(CamelModel):
    username: str
    password: str
    confirm_password: str
    role: RoleEnum
    admin_key: Optional[str] = None
    validation_code: Optional[str] = None


class AuthResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ChangePasswordPayload(CamelModel):
    current_password: str
    new_password: str


class MessageResponse(CamelModel):
    message: str


class PaginatedUsers(CamelModel):
    items: list[UserOut]
    total: int
    page: int
    page_size: int
    total_pages: int
