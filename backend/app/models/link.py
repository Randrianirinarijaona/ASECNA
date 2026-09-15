import enum
import uuid

from sqlalchemy import String, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.network import NetworkCategoryEnum


def gen_uuid() -> str:
    return str(uuid.uuid4())


class LinkDirectionEnum(str, enum.Enum):
    """
    REMPLACE l'ancien booléen `bidirectional`. Correspond au sélecteur
    "Entrant / Sortant / Entrant et sortant" de LinkManagerModal.tsx.
    Le point de départ (`from_airport_key`) étant désormais TOUJOURS
    Antananarivo (cf. LinkDirectionEnum + validation ci-dessous), la
    direction indique le sens du flux par rapport à Antananarivo :
    - outgoing : Antananarivo -> aéroport distant (flèche sortante)
    - incoming : aéroport distant -> Antananarivo (flèche entrante)
    - both     : flèche dans les deux sens
    """
    incoming = "incoming"
    outgoing = "outgoing"
    both = "both"


class LinkStatusEnum(str, enum.Enum):
    """État de la liaison, modifiable par un administrateur (LinkDetailModal.tsx)."""
    operational = "operational"
    maintenance = "maintenance"
    out_of_service = "out_of_service"


class NetworkLink(Base):
    """
    Correspond à NetworkLink (data/networkCategories.ts) : une liaison
    (flèche sur la carte) entre deux aéroports pour un sous-réseau donné.

    MODIFIÉ :
    - `from_airport_key` doit obligatoirement être l'aéroport d'Antananarivo
      (settings.ANTANANARIVO_AIRPORT_KEY), vérifié dans crud/link.py::create_link.
    - `bidirectional` (bool) est remplacé par `direction` (LinkDirectionEnum).
    - Nouveaux champs : `link_type`/`circuit` (facultatifs), `ip_address`/
      `port` (obligatoires côté API — nullable en base pour ne pas bloquer
      d'éventuelles lignes préexistantes lors de la migration).
    - Nouveau champ `status` (LinkStatusEnum), éditable par un admin.
    """
    __tablename__ = "network_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    category: Mapped[NetworkCategoryEnum] = mapped_column(Enum(NetworkCategoryEnum), nullable=False)
    item_title: Mapped[str] = mapped_column(String(150), nullable=False)
    from_airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)
    to_airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)

    direction: Mapped[LinkDirectionEnum] = mapped_column(
        Enum(LinkDirectionEnum), default=LinkDirectionEnum.outgoing, nullable=False
    )
    link_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    circuit: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    port: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[LinkStatusEnum] = mapped_column(
        Enum(LinkStatusEnum), default=LinkStatusEnum.operational, nullable=False
    )

    parameters: Mapped[list["LinkParameter"]] = relationship(
        back_populates="link", cascade="all, delete-orphan"
    )


class LinkParameter(Base):
    """Correspond à Parameter (types.ts) appliqué à une NetworkLink. Inchangé."""
    __tablename__ = "link_parameters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    link_id: Mapped[str] = mapped_column(ForeignKey("network_links.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    link = relationship("NetworkLink", back_populates="parameters")
    values: Mapped[list["LinkParameterValue"]] = relationship(
        back_populates="parameter", cascade="all, delete-orphan"
    )


class LinkParameterValue(Base):
    __tablename__ = "link_parameter_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    parameter_id: Mapped[str] = mapped_column(ForeignKey("link_parameters.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    text: Mapped[str] = mapped_column(String(500), nullable=False)

    parameter = relationship("LinkParameter", back_populates="values")


class AirportLocalParameter(Base):
    """Inchangé : paramètre local d'un aéroport (module Réseau local)."""
    __tablename__ = "airport_local_parameters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    airport = relationship("Airport", back_populates="local_parameters")
    values: Mapped[list["AirportLocalParameterValue"]] = relationship(
        back_populates="parameter", cascade="all, delete-orphan"
    )


class AirportLocalParameterValue(Base):
    __tablename__ = "airport_local_parameter_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    parameter_id: Mapped[str] = mapped_column(
        ForeignKey("airport_local_parameters.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    text: Mapped[str] = mapped_column(String(500), nullable=False)

    parameter = relationship("AirportLocalParameter", back_populates="values")
