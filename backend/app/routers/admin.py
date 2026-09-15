from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import require_admin
from app.models.airport import Airport
from app.models.link import NetworkLink
from app.models.log import ActivityLog
from app.models.user import User, RoleEnum
from app.schemas.admin import AdminStats, PaginatedActivityLogs, ActivityLogOut

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db)):
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_users = db.scalar(select(func.count()).select_from(User).where(User.is_active.is_(True))) or 0
    users_by_role = {role.value: (db.scalar(select(func.count()).select_from(User).where(User.role == role)) or 0) for role in RoleEnum}
    total_airports = db.scalar(select(func.count()).select_from(Airport).where(Airport.is_technical_point.is_(False))) or 0
    total_technical_points = db.scalar(select(func.count()).select_from(Airport).where(Airport.is_technical_point.is_(True))) or 0
    total_links = db.scalar(select(func.count()).select_from(NetworkLink)) or 0
    links_by_category: dict[str, int] = {}
    for row in db.execute(select(NetworkLink.category, func.count()).group_by(NetworkLink.category)):
        links_by_category[row[0].value] = row[1]
    return AdminStats(total_users=total_users, active_users=active_users, users_by_role=users_by_role, total_airports=total_airports, total_technical_points=total_technical_points, total_links=total_links, links_by_category=links_by_category)


@router.get("/logs", response_model=PaginatedActivityLogs)
def get_logs(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(ActivityLog)) or 0
    rows = db.scalars(select(ActivityLog).order_by(ActivityLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return PaginatedActivityLogs(items=[ActivityLogOut.model_validate(r) for r in rows], total=total, page=page, page_size=page_size, total_pages=user_crud.paginate_meta(total, page, page_size))
