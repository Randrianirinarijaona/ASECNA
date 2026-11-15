from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AppSetting(Base):
    """
    Paramètre applicatif modifiable à chaud par un administrateur
    (Settings.tsx). Sert actuellement à stocker la « clé de sécurité Admin »
    et le « code de validation technicien » utilisés à l'inscription.

    Si une valeur n'existe pas en base, l'application retombe sur la valeur
    définie dans le fichier .env (cf. app/core/config.py).
    """
    __tablename__ = "app_settings"

    setting_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    setting_value: Mapped[str] = mapped_column(String(255), nullable=False)
