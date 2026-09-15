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
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "asecna_network"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    # ─── Sécurité / JWT ─────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12

    # ─── Clés d'inscription (Login.tsx en mode "Créer un compte") ──────
    ADMIN_REGISTRATION_KEY: str = "ASECNA-ADMIN-KEY"
    TECHNICIEN_VALIDATION_CODE: str = "ASECNA-TECH-2026"

    # ─── Règle métier : point de départ obligatoire des liaisons ───────
    # Toute NetworkLink doit avoir from_airport_key == ANTANANARIVO_AIRPORT_KEY
    # (cf. crud/link.py::create_link). Centralisé ici plutôt qu'en dur dans
    # le code pour rester ajustable sans toucher à la logique métier.
    ANTANANARIVO_AIRPORT_KEY: str = "TNR"

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
