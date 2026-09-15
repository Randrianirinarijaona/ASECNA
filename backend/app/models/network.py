import enum
import uuid
from sqlalchemy import String, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class NetworkCategoryEnum(str, enum.Enum):
    sfa = "sfa"
    sma = "sma"
    srna = "srna"


class ItemStatusEnum(str, enum.Enum):
    operational = "operational"
    maintenance = "maintenance"
    planned = "planned"


class SubParamStatusEnum(str, enum.Enum):
    operational = "operational"
    maintenance = "maintenance"


class NetworkItem(Base):
    __tablename__ = "network_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)
    category: Mapped[NetworkCategoryEnum] = mapped_column(Enum(NetworkCategoryEnum), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[ItemStatusEnum | None] = mapped_column(Enum(ItemStatusEnum), nullable=True)

    airport = relationship("Airport", back_populates="network_items")
    sub_parameters: Mapped[list["NetworkSubParameter"]] = relationship(back_populates="item", cascade="all, delete-orphan")


class NetworkSubParameter(Base):
    __tablename__ = "network_sub_parameters"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    item_id: Mapped[str] = mapped_column(ForeignKey("network_items.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[SubParamStatusEnum] = mapped_column(Enum(SubParamStatusEnum), default=SubParamStatusEnum.operational, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    item = relationship("NetworkItem", back_populates="sub_parameters")
