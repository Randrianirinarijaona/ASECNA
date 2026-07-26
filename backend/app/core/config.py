"""
Configuration centralisée de l'application, lue depuis les variables
d'environnement (fichier .env en local, variables réelles en production).
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ─── Application ────────────────────────────────────────────────────
    APP_NAME: str = "ASECNA Network API"
    ENV: str = "development"
    DEBUG: bool = True

    # ─── Base de données (MySQL / WampServer) ──────────────────────────
    # Exemple WampServer par défaut : root sans mot de passe, port 3306
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "asecna_network"

    @property
    def DATABASE_URL(self) -> str:
        # pymysql comme driver : compatible WampServer / MySQL classique
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    # ─── Sécurité / JWT ─────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12h

    # ─── Clés d'inscription (mock du process ASECNA) ───────────────────
    # Requises par Login.tsx pour créer un compte admin / technicien.
    ADMIN_REGISTRATION_KEY: str = "ASECNA-ADMIN-KEY"
    TECHNICIEN_VALIDATION_CODE: str = "ASECNA-TECH-2026"

    # ─── CORS ────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
