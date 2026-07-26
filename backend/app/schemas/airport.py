from typing import Optional

from app.schemas.base import CamelModel
from app.schemas.network import NetworkItemOut


# ─── Paramètres nommés génériques (liaisons ET infos locales) ──────────
# Reproduit fidèlement Parameter / ParameterValue de types.ts, réutilisé
# tel quel par NetworkLink.parameters et Airport.localParameters.

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


# ─── Aéroport ────────────────────────────────────────────────────────────

class AirportCreate(CamelModel):
    """Correspond au payload envoyé par AddAirportModal.tsx (onSubmit)."""
    key: str  # code IATA saisi, utilisé comme clé primaire
    name: str
    iata: str
    lat: float
    lng: float


class TechnicalPointCreate(CamelModel):
    """Correspond au payload de NetworkNodeModal.tsx (mode 'add')."""
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
    """Version allégée utilisée pour les listes (markers, pickers)."""
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


class LinkOut(CamelModel):
    id: str
    category: str
    item_title: str
    from_airport_key: str
    to_airport_key: str
    parameters: list[ParameterOut] = []
