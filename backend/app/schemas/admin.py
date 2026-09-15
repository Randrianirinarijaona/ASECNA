from datetime import datetime
from typing import Optional
from app.schemas.base import CamelModel


class AdminStats(CamelModel):
    total_users: int
    active_users: int
    users_by_role: dict[str, int]
    total_airports: int
    total_technical_points: int
    total_links: int
    links_by_category: dict[str, int]


class ActivityLogOut(CamelModel):
    id: int
    user_id: Optional[str] = None
    username: str
    action: str
    details: Optional[str] = None
    created_at: datetime


class PaginatedActivityLogs(CamelModel):
    items: list[ActivityLogOut]
    total: int
    page: int
    page_size: int
    total_pages: int
