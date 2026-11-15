from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.crud import app_setting as setting_crud
from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import require_admin
from app.models.airport import Airport
from app.models.link import NetworkLink
from app.models.log import ActivityLog
from app.models.user import User, RoleEnum
from app.schemas.admin import (
    AdminStats,
    PaginatedActivityLogs,
    ActivityLogOut,
    RegistrationKeysOut,
    RegistrationKeysUpdate,
)

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

REGISTRATION_KEY_MIN_LENGTH = 8
REGISTRATION_KEY_MAX_LENGTH = 100


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


# ─── Clés d'inscription ──────────────────────────────────────────────────────

def _registration_keys_out(db: Session) -> RegistrationKeysOut:
    return RegistrationKeysOut(
        admin_key=setting_crud.get_admin_registration_key(db),
        technicien_code=setting_crud.get_technicien_validation_code(db),
    )


def _clean_key(value: str | None, label: str) -> str | None:
    """None = champ non modifié ; sinon valeur nettoyée et validée (400 sinon)."""
    if value is None:
        return None
    cleaned = value.strip()
    if len(cleaned) < REGISTRATION_KEY_MIN_LENGTH:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"{label} doit contenir au moins {REGISTRATION_KEY_MIN_LENGTH} caractères",
        )
    if len(cleaned) > REGISTRATION_KEY_MAX_LENGTH:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"{label} ne doit pas dépasser {REGISTRATION_KEY_MAX_LENGTH} caractères",
        )
    return cleaned


@router.get("/registration-keys", response_model=RegistrationKeysOut)
def get_registration_keys(db: Session = Depends(get_db)):
    """Clé de sécurité Admin et code de validation technicien actuellement en vigueur."""
    return _registration_keys_out(db)


@router.put("/registration-keys", response_model=RegistrationKeysOut)
def update_registration_keys(
    payload: RegistrationKeysUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Modifie la clé de sécurité Admin et/ou le code de validation technicien.
    Les valeurs elles-mêmes ne sont jamais écrites dans le journal d'activité."""
    admin_key = _clean_key(payload.admin_key, "La clé de sécurité Admin")
    technicien_code = _clean_key(payload.technicien_code, "Le code de validation technicien")

    if admin_key is None and technicien_code is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Aucune modification fournie")

    setting_crud.set_registration_keys(db, admin_key=admin_key, technicien_code=technicien_code)

    changed = []
    if admin_key is not None:
        changed.append("clé de sécurité Admin")
    if technicien_code is not None:
        changed.append("code de validation technicien")
    user_crud.log_activity(db, current_user, "Modification des clés d'inscription", ", ".join(changed))

    return _registration_keys_out(db)
