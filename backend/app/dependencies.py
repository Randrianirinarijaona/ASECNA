"""
Dépendances FastAPI réutilisées par tous les routers : récupération de
l'utilisateur courant à partir du Bearer token, et garde-fous par rôle,
répliquant côté serveur la logique de RouteGuards.tsx (PrivateRoute /
AdminRoute) et de `user?.role === 'admin'` disséminé dans le frontend
(MainSidebar, NetworkModal, NetworkItemModal, LinkDetailModal...).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User, RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Réservé au rôle 'admin' (Admin panel, AdminRoute côté frontend)."""
    if user.role != RoleEnum.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Réservé aux administrateurs")
    return user


def require_write_access(user: User = Depends(get_current_user)) -> User:
    """
    Réservé aux rôles 'admin' et 'technicien'. Correspond à
    `canAccessNetworkSettings = user?.role !== 'user'` dans MapPage.tsx :
    le rôle 'user' est en lecture seule stricte sur tout le module carte.
    """
    if user.role == RoleEnum.user:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Accès réservé : votre compte est en lecture seule.",
        )
    return user
