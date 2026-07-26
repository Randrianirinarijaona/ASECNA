from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate, PaginatedUsers, MessageResponse

router = APIRouter(prefix="/users", tags=["Users"])


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
        avatar_initials=user.get_avatar_initials(),
    )


@router.get("", response_model=PaginatedUsers)
def list_users(
    page: int = 1,
    page_size: int = 10,
    search: str = "",
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = user_crud.list_users(db, page, page_size, search)
    return PaginatedUsers(
        items=[_to_user_out(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=user_crud.paginate_meta(total, page, page_size),
    )


def _get_user_or_404(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Un utilisateur peut lire son propre profil ; un admin peut lire n'importe lequel
    # (Profile.tsx appelle userService.update sur son propre id, cohérent avec ce contrôle).
    if current_user.id != user_id and current_user.role.value != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return _to_user_out(_get_user_or_404(db, user_id))


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Couvre à la fois Profile.tsx (l'utilisateur modifie username/email) et
    l'admin panel (changement de rôle / activation), en restreignant les
    champs sensibles (role, isActive) aux administrateurs.
    """
    target = _get_user_or_404(db, user_id)

    is_self = current_user.id == user_id
    is_admin = current_user.role.value == "admin"
    if not is_self and not is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    fields = payload.model_dump(exclude_unset=True)
    if not is_admin:
        fields.pop("role", None)
        fields.pop("is_active", None)

    updated = user_crud.update_user(db, target, **fields)
    user_crud.log_activity(db, current_user, f"Mise à jour du profil de {target.username}")
    return _to_user_out(updated)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(user_id: str, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    target = _get_user_or_404(db, user_id)
    if target.id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Impossible de supprimer son propre compte")
    user_crud.delete_user(db, target)
    user_crud.log_activity(db, current_user, f"Suppression de l'utilisateur {target.username}")
    return MessageResponse(message="Utilisateur supprimé")
