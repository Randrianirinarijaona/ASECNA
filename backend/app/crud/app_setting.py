"""
Accès aux paramètres applicatifs modifiables (clés d'inscription).

Règle : une valeur enregistrée en base (modifiée par un administrateur dans
Settings) l'emporte sur la valeur du fichier .env ; sans valeur en base, on
utilise celle du .env (comportement historique, donc rien ne change tant
qu'un administrateur n'a rien modifié).
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.app_setting import AppSetting

ADMIN_KEY_SETTING = "admin_registration_key"
TECH_CODE_SETTING = "technicien_validation_code"


def _get_value(db: Session, name: str) -> str | None:
    row = db.get(AppSetting, name)
    return row.setting_value if row else None


def get_admin_registration_key(db: Session) -> str:
    return _get_value(db, ADMIN_KEY_SETTING) or settings.ADMIN_REGISTRATION_KEY


def get_technicien_validation_code(db: Session) -> str:
    return _get_value(db, TECH_CODE_SETTING) or settings.TECHNICIEN_VALIDATION_CODE


def set_registration_keys(
    db: Session, admin_key: str | None = None, technicien_code: str | None = None
) -> None:
    """Enregistre uniquement les valeurs fournies (None = inchangé)."""
    for name, value in ((ADMIN_KEY_SETTING, admin_key), (TECH_CODE_SETTING, technicien_code)):
        if value is None:
            continue
        row = db.get(AppSetting, name)
        if row:
            row.setting_value = value
        else:
            db.add(AppSetting(setting_key=name, setting_value=value))
    db.commit()
