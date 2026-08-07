from app.schemas.airport import ParameterOut
from app.schemas.base import CamelModel


class LocalTechnicalPointCreate(CamelModel):
    """Correspond au payload de la modale de nommage (MapPage.tsx) après
    un clic sur la carte zoomée d'un aéroport."""
    name: str
    lat: float
    lng: float


class LocalTechnicalPointOut(CamelModel):
    id: str
    parent_airport_key: str
    name: str
    coords: tuple[float, float]
    local_parameters: list[ParameterOut] = []
