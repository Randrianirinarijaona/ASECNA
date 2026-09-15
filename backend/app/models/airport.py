from sqlalchemy import String, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Airport(Base):
    __tablename__ = "airports"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    iata: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    is_technical_point: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    in_local_network: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    network_items: Mapped[list["NetworkItem"]] = relationship(back_populates="airport", cascade="all, delete-orphan")
    local_parameters: Mapped[list["AirportLocalParameter"]] = relationship(back_populates="airport", cascade="all, delete-orphan")
