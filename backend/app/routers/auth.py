import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import create_access_token, verify_password
from app.crud import app_setting as setting_crud
from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.base import CamelModel
from app.schemas.user import LoginPayload, RegisterPayload, AuthResponse, UserOut, MessageResponse, ChangePasswordPayload

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _to_user_out(user: User) -> UserOut:
    return UserOut(id=user.id, username=user.username, email=user.email, role=user.role, is_active=user.is_active, created_at=user.created_at, last_login=user.last_login, avatar_initials=user.get_avatar_initials())


def _same_secret(provided: str | None, expected: str) -> bool:
    """Comparaison en temps constant (évite de révéler la clé par le temps de réponse)."""
    return secrets.compare_digest((provided or "").strip().encode("utf-8"), expected.encode("utf-8"))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = user_crud.authenticate(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Ce compte a été désactivé.")
    user = user_crud.touch_last_login(db, user)
    token = create_access_token(subject=user.id, role=user.role.value)
    return AuthResponse(access_token=token, user=_to_user_out(user))


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    if payload.password != payload.confirm_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Les mots de passe ne correspondent pas")
    # MODIFIÉ : la clé Admin et le code technicien sont lus via app_setting
    # (valeur modifiée par l'admin dans Settings, sinon valeur du .env).
    if payload.role == RoleEnum.admin and not _same_secret(
        payload.admin_key, setting_crud.get_admin_registration_key(db)
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Clé administrateur invalide")
    if payload.role == RoleEnum.technicien and not _same_secret(
        payload.validation_code, setting_crud.get_technicien_validation_code(db)
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Code de validation technicien invalide")
    if user_crud.get_by_username(db, payload.username):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Ce nom d'utilisateur est déjà pris")
    user_crud.create_user(db, payload.username, payload.password, payload.role)
    return MessageResponse(message="Compte créé avec succès")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return _to_user_out(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(payload: ChangePasswordPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect")
    user_crud.change_password(db, current_user, payload.new_password)
    return MessageResponse(message="Mot de passe modifié avec succès")


class ResetPasswordPayload(CamelModel):
    email: str


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_request(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    return MessageResponse(message="Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.")
