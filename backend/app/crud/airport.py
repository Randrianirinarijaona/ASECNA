import time

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.airport import Airport
from app.models.network import NetworkCategoryEnum, NetworkItem
from app.models.link import AirportLocalParameter
from app.schemas.airport import AirportOut, AirportSummaryOut, ParameterOut, ParameterValueOut
from app.schemas.network import NetworkItemOut, SubParameterOut


def _serialize_airport(airport: Airport) -> AirportOut:
    """
    Reconstruit exactement la forme `Airport` de types.ts, notamment le
    regroupement des items par catégorie dans `sections: { sfa: [], sma:
    [], srna: [] }`, tel que consommé par NetworkModal.tsx et
    networkCategories.ts (airport.sections[category]).
    """
    sections: dict[str, list[NetworkItemOut]] = {"sfa": [], "sma": [], "srna": []}
    for item in airport.network_items:
        sections[item.category.value].append(
            NetworkItemOut(
                id=item.id,
                airport_key=item.airport_key,
                category=item.category,
                title=item.title,
                description=item.description,
                details=item.details,
                status=item.status,
                sub_parameters=[SubParameterOut.model_validate(s) for s in item.sub_parameters],
            )
        )

    local_parameters = [
        ParameterOut(
            id=p.id,
            name=p.name,
            values=[ParameterValueOut.model_validate(v) for v in p.values],
        )
        for p in airport.local_parameters
    ]

    return AirportOut(
        key=airport.key,
        name=airport.name,
        iata=airport.iata,
        coords=(airport.lat, airport.lng),
        is_technical_point=airport.is_technical_point,
        in_local_network=airport.in_local_network,
        sections=sections,
        local_parameters=local_parameters,
    )


def get_airport(db: Session, key: str) -> Airport | None:
    return db.scalar(
        select(Airport)
        .options(
            selectinload(Airport.network_items).selectinload(NetworkItem.sub_parameters),
            selectinload(Airport.local_parameters).selectinload(AirportLocalParameter.values),
        )
        .where(Airport.key == key)
    )


def get_airport_out(db: Session, key: str) -> AirportOut | None:
    airport = get_airport(db, key)
    return _serialize_airport(airport) if airport else None


def list_airports(db: Session, technical_only: bool | None = None) -> list[Airport]:
    query = select(Airport).options(
        selectinload(Airport.network_items).selectinload(NetworkItem.sub_parameters),
        selectinload(Airport.local_parameters).selectinload(AirportLocalParameter.values),
    )
    if technical_only is True:
        query = query.where(Airport.is_technical_point.is_(True))
    elif technical_only is False:
        query = query.where(Airport.is_technical_point.is_(False))
    return list(db.scalars(query))


def list_airports_out(db: Session, technical_only: bool | None = None) -> list[AirportOut]:
    return [_serialize_airport(a) for a in list_airports(db, technical_only)]


def summarize(airport: Airport) -> AirportSummaryOut:
    return AirportSummaryOut(
        key=airport.key,
        name=airport.name,
        iata=airport.iata,
        coords=(airport.lat, airport.lng),
        is_technical_point=airport.is_technical_point,
        in_local_network=airport.in_local_network,
    )


def create_airport(db: Session, key: str, name: str, iata: str, lat: float, lng: float) -> Airport:
    """Correspond à useAirportsData.addAirport (AddAirportModal.tsx)."""
    airport = Airport(key=key, name=name, iata=iata, lat=lat, lng=lng, is_technical_point=False)
    db.add(airport)
    db.commit()
    db.refresh(airport)
    return airport


def create_technical_point(
    db: Session, category: NetworkCategoryEnum, sub_item: str, name: str, lat: float, lng: float
) -> Airport:
    """
    Correspond à useAirportsData.addTechnicalPoint : crée un point technique
    (relais VHF/HF, antenne...) ET son NetworkItem initial dans la
    catégorie/sous-réseau demandé, en une seule opération transactionnelle
    (contrairement au frontend qui le faisait en mémoire en un seul objet).
    """
    from app.models.network import NetworkItem  # import local pour éviter un cycle

    key = f"tech-{category.value}-{sub_item}-{int(time.time() * 1000)}"
    airport = Airport(key=key, name=name, iata="", lat=lat, lng=lng, is_technical_point=True)
    db.add(airport)
    db.flush()  # obtenir airport.key avant le NetworkItem

    item = NetworkItem(airport_key=airport.key, category=category, title=sub_item, status="operational")
    db.add(item)
    db.commit()
    db.refresh(airport)
    return airport


def delete_airport(db: Session, airport: Airport) -> None:
    """
    La suppression en cascade (items, sous-paramètres, paramètres locaux,
    liaisons pointant vers/depuis cet aéroport) est gérée par les
    `ondelete="CASCADE"` définis dans les modèles, reproduisant
    useAirportsData.deleteAirport (qui purge aussi les links associés).
    """
    db.delete(airport)
    db.commit()


def set_local_network_membership(db: Session, airport: Airport, member: bool) -> Airport:
    airport.in_local_network = member
    db.commit()
    db.refresh(airport)
    return airport
