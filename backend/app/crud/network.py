from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.airport import Airport
from app.models.network import NetworkItem, NetworkSubParameter, NetworkCategoryEnum
from app.schemas.network import AirportNetworkMatchOut


def add_item(
    db: Session,
    airport: Airport,
    category: NetworkCategoryEnum,
    title: str,
    status_value: str | None,
    description: str | None,
    details: list[str] | None,
) -> NetworkItem:
    """Correspond à useAirportsData.addNetworkItem : refuse les doublons de
    titre (insensible à la casse) au sein d'un même aéroport + catégorie."""
    existing = db.scalar(
        select(NetworkItem).where(
            NetworkItem.airport_key == airport.key,
            NetworkItem.category == category,
            func.lower(NetworkItem.title) == title.lower(),
        )
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Le paramètre '{title}' existe déjà pour cet aéroport",
        )

    # Les items SFA n'ont plus de statut global (cf. point 3 du brief) :
    # on force `status` à None quelle que soit la valeur reçue.
    effective_status = None if category == NetworkCategoryEnum.sfa else (status_value or "operational")

    item = NetworkItem(
        airport_key=airport.key,
        category=category,
        title=title,
        status=effective_status,
        description=description,
        details=details,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item(db: Session, airport_key: str, category: NetworkCategoryEnum, title: str) -> NetworkItem | None:
    return db.scalar(
        select(NetworkItem).where(
            NetworkItem.airport_key == airport_key,
            NetworkItem.category == category,
            NetworkItem.title == title,
        )
    )


def get_item_by_id(db: Session, item_id: str) -> NetworkItem | None:
    return db.get(NetworkItem, item_id)


def delete_item(db: Session, item: NetworkItem) -> None:
    """
    La suppression en cascade des sous-paramètres est gérée par le modèle.
    La suppression des NetworkLink associées (comportement de
    useAirportsData.deleteNetworkItem) est effectuée par l'appelant (router)
    car elle nécessite une correspondance floue category+itemTitle, gérée
    dans crud/link.py::delete_links_for_item.
    """
    db.delete(item)
    db.commit()


def update_status(db: Session, item: NetworkItem, status_value: str) -> NetworkItem:
    if item.category == NetworkCategoryEnum.sfa:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Les items SFA n'ont pas de statut global",
        )
    item.status = status_value
    db.commit()
    db.refresh(item)
    return item


def update_description(db: Session, item: NetworkItem, description: str) -> NetworkItem:
    item.description = description
    db.commit()
    db.refresh(item)
    return item


def add_sub_parameter(db: Session, item: NetworkItem, title: str, value: str) -> NetworkSubParameter:
    sub = NetworkSubParameter(item_id=item.id, title=title, value=value, status="operational")
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def get_sub_parameter(db: Session, sub_id: str) -> NetworkSubParameter | None:
    return db.get(NetworkSubParameter, sub_id)


def delete_sub_parameter(db: Session, sub: NetworkSubParameter) -> None:
    db.delete(sub)
    db.commit()


def toggle_sub_parameter_status(db: Session, sub: NetworkSubParameter) -> NetworkSubParameter:
    sub.status = "maintenance" if sub.status.value == "operational" else "operational"
    db.commit()
    db.refresh(sub)
    return sub


def get_airports_by_network(
    db: Session, category: NetworkCategoryEnum, sub_item: str
) -> list[AirportNetworkMatchOut]:
    """
    Reproduit data/networkCategories.ts::getAirportsByNetwork : liste tous
    les aéroports dont un item de la catégorie donnée contient `sub_item`
    dans son titre (insensible à la casse), utilisé par NetworkUsageTab.
    """
    items = db.scalars(
        select(NetworkItem)
        .where(NetworkItem.category == category)
        .join(Airport, Airport.key == NetworkItem.airport_key)
    ).all()

    results: list[AirportNetworkMatchOut] = []
    needle = sub_item.lower()
    for item in items:
        if needle in item.title.lower():
            airport = db.get(Airport, item.airport_key)
            if airport:
                results.append(
                    AirportNetworkMatchOut(
                        key=airport.key,
                        matched_title=item.title,
                        status=item.status,
                        airport_name=airport.name,
                        airport_iata=airport.iata,
                    )
                )
    return results
