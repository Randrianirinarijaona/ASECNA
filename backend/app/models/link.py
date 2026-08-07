import uuid

from sqlalchemy import String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.network import NetworkCategoryEnum


def gen_uuid() -> str:
    return str(uuid.uuid4())


class NetworkLink(Base):
    """
    Correspond à NetworkLink (data/networkCategories.ts) : une liaison
    (flèche sur la carte) entre deux aéroports pour un sous-réseau donné.

    L'unicité (une seule liaison par paire d'aéroports + sous-réseau, quel
    que soit le sens) est vérifiée en base uniquement par un couple
    (category, item_title, from_airport_key, to_airport_key) ; la
    vérification "sens inverse" (A->B == B->A) est appliquée côté service
    Python, à l'identique de useAirportsData.addNetworkLink côté frontend,
    car MySQL ne permet pas nativement une contrainte d'unicité symétrique.
    """
    __tablename__ = "network_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    category: Mapped[NetworkCategoryEnum] = mapped_column(Enum(NetworkCategoryEnum), nullable=False)
    item_title: Mapped[str] = mapped_column(String(150), nullable=False)
    from_airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)
    to_airport_key: Mapped[str] = mapped_column(ForeignKey("airports.key", ondelete="CASCADE"), nullable=False)
    # NOUVEAU (LinkManagerModal.tsx : sélecteur "Unidirectionnelle /
    # Bidirectionnelle"). false = comportement historique (flèche from -> to
    # uniquement). true = flèche affichée dans les deux sens côté frontend
    # (NetworkArrow), sans dupliquer la ligne en base.
    bidirectional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    parameters: Mapped[list["LinkParameter"]] = relationship(
        back_populates="link", cascade="all, delete-orphan"
    )


class LinkParameter(Base):
    """Correspond à Parameter (types.ts) appliqué à une NetworkLink."""
    __tablename__ = "link_parameters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    link_id: Mapped[str] = mapped_column(ForeignKey("network_links.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    link = relationship("NetworkLink", back_populates="parameters")
    values: Mapped[list["LinkParameterValue"]] = relationship(
        back_populates="parameter", cascade="all, delete-orphan"
    )


class LinkParameterValue(Base):
    """Correspond à ParameterValue (types.ts) appliqué à un LinkParameter."""
    __tablename__ = "link_parameter_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    parameter_id: Mapped[str] = mapped_column(ForeignKey("link_parameters.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    text: Mapped[str] = mapped_column(String(500), nullable=False)

    parameter = relationship("LinkParameter", back_populates="values")


class AirportLocalParameter(Base):
    """
    Correspond à Parameter (types.ts) appliqué à Airport.localParameters
    (module "Réseau local" — cf. LocalNetworkModal.tsx). Structure identique
    à LinkParameter, mais rattachée directement à un aéroport et
    indépendante des sections réseau / liaisons.
    """
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
