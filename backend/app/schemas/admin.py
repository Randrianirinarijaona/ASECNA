from datetime import datetime
from typing import Optional

from app.schemas.base import CamelModel


class AdminStats(CamelModel):
    """
    Reconstruit à partir de l'usage de adminService.getStats() (référencé
    dans api.service.ts mais consommateur — Admin.tsx — non fourni). Champs
    choisis pour couvrir les besoins visibles dans Dashboard.tsx (compteurs
    aéroports/connexions/utilisateurs) et un panneau Admin standard.
    """
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
