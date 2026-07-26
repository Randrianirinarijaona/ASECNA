from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ActivityLog(Base):
    """
    Correspond à ActivityLog (types manquant côté frontend, reconstruit ici
    à partir de l'usage attendu par adminService.getLogs() et de la maquette
    "Recent activity" du Dashboard). Alimente le panneau Admin.

    On garde `username` en clair (snapshot au moment de l'action) pour que
    le journal reste lisible même si l'utilisateur est supprimé ensuite.
    """
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
