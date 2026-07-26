"""
Router d'authentification. Remplace le mock de contexts.tsx (AuthProvider /
MOCK_USERS, login à mot de passe unique '123456') par une authentification
JWT réelle contre la table `users`, tout en conservant EXACTEMENT les
signatures attendues par services/api.service.ts (authService).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, RoleEnum
from app.schemas.base import CamelModel
from app.schemas.user import (
    LoginPayload,
    RegisterPayload,
    AuthResponse,
    UserOut,
    MessageResponse,
    ChangePasswordPayload,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


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


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = user_crud.authenticate(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects.",
        )
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Ce compte a été désactivé.")

    user = user_crud.touch_last_login(db, user)
    token = create_access_token(subject=user.id, role=user.role.value)
    user_crud.log_activity(db, user, "Connexion au portail")

    return AuthResponse(access_token=token, user=_to_user_out(user))


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    """
    Reproduit la validation de Login.tsx (validateForm) : mot de passe
    confirmé, clé admin requise pour role='admin', code de validation requis
    pour role='technicien'. Les valeurs attendues sont configurables via
    .env (ADMIN_REGISTRATION_KEY / TECHNICIEN_VALIDATION_CODE) plutôt que
    codées en dur, pour rester adaptable en production.
    """
    if payload.password != payload.confirm_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Les mots de passe ne correspondent pas")

    if payload.role == RoleEnum.admin and payload.admin_key != settings.ADMIN_REGISTRATION_KEY:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Clé administrateur invalide")

    if payload.role == RoleEnum.technicien and payload.validation_code != settings.TECHNICIEN_VALIDATION_CODE:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Code de validation technicien invalide")

    if user_crud.get_by_username(db, payload.username):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Ce nom d'utilisateur est déjà pris")

    user_crud.create_user(db, payload.username, payload.password, payload.role)
    return MessageResponse(message="Compte créé avec succès")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return _to_user_out(current_user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.core.security import verify_password

    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect")

    user_crud.change_password(db, current_user, payload.new_password)
    user_crud.log_activity(db, current_user, "Changement de mot de passe")
    return MessageResponse(message="Mot de passe modifié avec succès")


class ResetPasswordPayload(CamelModel):
    email: str


@router.post("/reset-password", response_model=MessageResponse)
def reset_password_request(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    """
    Reçoit { "email": "..." } en JSON (corps de requête), tel qu'envoyé par
    authService.resetPasswordRequest() dans api.service.ts. Réponse
    volontairement neutre (ne révèle pas si l'email existe). L'envoi réel
    d'email n'est pas implémenté (nécessiterait un service SMTP externe) —
    voir README, section "Limitations connues".
    """
    return MessageResponse(
        message="Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
    )
