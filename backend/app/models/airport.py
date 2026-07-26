from sqlalchemy import String, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Airport(Base):
    """
    Représente à la fois un vrai aéroport (ex: 'TNR') et un point technique
    de réseau (relais VHF/HF, antenne SRNA...) créé via NetworkNodeModal,
    distingué par is_technical_point (cf. types.ts -> Airport.isTechnicalPoint).

    La clé primaire `key` correspond exactement à la clé utilisée côté
    frontend dans AirportsMap (Record<string, Airport>) : code IATA pour un
    aéroport réel, ou identifiant technique généré pour un point technique.
    """
    __tablename__ = "airports"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    iata: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)

    is_technical_point: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Statut d'appartenance à la liste "Réseau local" de la sidebar
    # (cf. useAirportsData.localNetworkAirportKeys). Un booléen suffit ici
    # car il s'agit d'un simple indicateur d'affichage, pas d'une relation.
    in_local_network: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    network_items: Mapped[list["NetworkItem"]] = relationship(
        back_populates="airport", cascade="all, delete-orphan"
    )
    local_parameters: Mapped[list["AirportLocalParameter"]] = relationship(
        back_populates="airport", cascade="all, delete-orphan"
    )
