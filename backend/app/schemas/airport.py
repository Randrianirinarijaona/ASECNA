from typing import Optional

from app.schemas.base import CamelModel
from app.schemas.network import NetworkItemOut


# ─── Paramètres nommés génériques (liaisons ET infos locales) ──────────

class ParameterValueOut(CamelModel):
    id: str
    name: str
    text: str


class ParameterOut(CamelModel):
    id: str
    name: str
    values: list[ParameterValueOut] = []


class ParameterValueCreate(CamelModel):
    name: str
    text: str


class ParameterCreate(CamelModel):
    name: str


class ParameterUpdate(CamelModel):
    name: Optional[str] = None


class ParameterValueUpdate(CamelModel):
    name: Optional[str] = None
    text: Optional[str] = None


# ─── Aéroport ────────────────────────────────────────────────────────────

class AirportCreate(CamelModel):
    key: str
    name: str
    iata: Optional[str] = ""
    lat: float
    lng: float


class AirportUpdate(CamelModel):
    name: Optional[str] = None
    iata: Optional[str] = None


class TechnicalPointCreate(CamelModel):
    name: str
    lat: float
    lng: float


class AirportOut(CamelModel):
    key: str
    name: str
    iata: str
    coords: tuple[float, float]
    is_technical_point: bool
    in_local_network: bool
    sections: dict[str, list[NetworkItemOut]]
    local_parameters: list[ParameterOut] = []


class AirportSummaryOut(CamelModel):
    key: str
    name: str
    iata: str
    coords: tuple[float, float]
    is_technical_point: bool
    in_local_network: bool


# ─── Liaisons (NetworkLink) ──────────────────────────────────────────────

class LinkCreate(CamelModel):
    category: str
    item_title: str
    from_airport_key: str
    to_airport_key: str
    direction: str = "outgoing"
    link_type: Optional[str] = None
    circuit: Optional[str] = None
    ip_address: str
    port: str


# NOUVEAU : modification des informations d'une liaison existante
# (admin uniquement). Tous les champs sont optionnels : seuls ceux
# réellement envoyés sont modifiés.
class LinkUpdate(CamelModel):
    direction: Optional[str] = None
    link_type: Optional[str] = None
    circuit: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[str] = None


class LinkOut(CamelModel):
    id: str
    category: str
    item_title: str
    from_airport_key: str
    to_airport_key: str
    direction: str
    link_type: Optional[str] = None
    circuit: Optional[str] = None
    ip_address: str
    port: str
    status: str
    parameters: list[ParameterOut] = []


class LinkStatusUpdate(CamelModel):
    status: str