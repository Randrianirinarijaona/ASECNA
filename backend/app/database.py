"""
Initialisation du moteur SQLAlchemy et fourniture des sessions de base de
données via une dépendance FastAPI (get_db).
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # évite les erreurs "MySQL server has gone away"
    pool_recycle=3600,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe de base déclarative pour tous les modèles ORM."""
    pass


def get_db():
    """Dépendance FastAPI : ouvre une session par requête, la ferme ensuite."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
