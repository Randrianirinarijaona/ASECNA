import uuid
from sqlalchemy import String, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class LocalTechnicalPoint(Base):
    __tablename__ = "local_technical_points"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    parent_airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)

    local_parameters: Mapped[list["LocalTechnicalPointParameter"]] = relationship(back_populates="point", cascade="all, delete-orphan")


class LocalTechnicalPointParameter(Base):
    __tablename__ = "local_technical_point_parameters"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    point_id: Mapped[str] = mapped_column(ForeignKey("local_technical_points.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    point = relationship("LocalTechnicalPoint", back_populates="local_parameters")
    values: Mapped[list["LocalTechnicalPointParameterValue"]] = relationship(back_populates="parameter", cascade="all, delete-orphan")


class LocalTechnicalPointParameterValue(Base):
    __tablename__ = "local_technical_point_parameter_values"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    parameter_id: Mapped[str] = mapped_column(ForeignKey("local_technical_point_parameters.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    text: Mapped[str] = mapped_column(String(500), nullable=False)

    parameter = relationship("LocalTechnicalPointParameter", back_populates="values")
