from typing import Optional

from app.models.link import LinkDirectionEnum, LinkStatusEnum
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


# ─── Aéroport ────────────────────────────────────────────────────────────

class AirportCreate(CamelModel):
    """MODIFIÉ : `iata` est désormais optionnel (le formulaire
    AddAirportModal.tsx n'exige plus ce champ)."""
    key: str
    name: str
    iata: Optional[str] = ""
    lat: float
    lng: float


class AirportUpdate(CamelModel):
    """NOUVEAU : édition du nom / code IATA d'un aéroport existant, réservée
    à l'administrateur (NetworkModal.tsx, bouton "Modifier")."""
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
    """
    MODIFIÉ :
    - `from_airport_key` doit être l'aéroport d'Antananarivo (vérifié dans
      crud/link.py::create_link) ; le champ reste présent (plutôt que
      supprimé) pour que le backend reste la source de vérité de cette
      règle même si un client mal formé l'omettait ou la contournait.
    - `bidirectional` (bool) est remplacé par `direction`.
    - Nouveaux champs : `link_type`/`circuit` (facultatifs, valeur par
      défaut None), `ip_address`/`port` (obligatoires, non optionnels).
    """
    category: str
    item_title: str
    from_airport_key: str
    to_airport_key: str
    direction: LinkDirectionEnum = LinkDirectionEnum.outgoing
    link_type: Optional[str] = None
    circuit: Optional[str] = None
    ip_address: str
    port: str


class LinkStatusUpdate(CamelModel):
    """Payload de PATCH /links/{id}/status (LinkDetailModal.tsx, admin uniquement)."""
    status: LinkStatusEnum


class LinkOut(CamelModel):
    id: str
    category: str
    item_title: str
    from_airport_key: str
    to_airport_key: str
    direction: LinkDirectionEnum
    link_type: Optional[str] = None
    circuit: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[str] = None
    status: LinkStatusEnum
    parameters: list[ParameterOut] = []