from fastapi import HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import Session, selectinload

from app.models.link import (
    NetworkLink,
    LinkParameter,
    LinkParameterValue,
    AirportLocalParameter,
    AirportLocalParameterValue,
)
from app.models.network import NetworkCategoryEnum


def _links_query():
    return select(NetworkLink).options(
        selectinload(NetworkLink.parameters).selectinload(LinkParameter.values)
    )


def list_links(db: Session) -> list[NetworkLink]:
    return list(db.scalars(_links_query()))


def get_link(db: Session, link_id: str) -> NetworkLink | None:
    return db.scalar(_links_query().where(NetworkLink.id == link_id))


def create_link(
    db: Session,
    category: NetworkCategoryEnum,
    item_title: str,
    from_key: str,
    to_key: str,
    bidirectional: bool = False,
) -> NetworkLink:
    """
    Reproduit useAirportsData.addNetworkLink : refuse une liaison vers
    soi-même, et refuse un doublon quel que soit le sens (A->B équivaut à
    B->A pour un même sous-réseau). `bidirectional` est un simple attribut
    d'affichage (cf. LinkManagerModal.tsx) : il ne crée pas de deuxième
    ligne en base, juste un indicateur pour dessiner la flèche retour.
    """
    if from_key == to_key:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Impossible de relier un aéroport à lui-même")

    existing = db.scalar(
        select(NetworkLink).where(
            NetworkLink.category == category,
            NetworkLink.item_title == item_title,
            or_(
                and_(NetworkLink.from_airport_key == from_key, NetworkLink.to_airport_key == to_key),
                and_(NetworkLink.from_airport_key == to_key, NetworkLink.to_airport_key == from_key),
            ),
        )
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Cette liaison existe déjà")

    link = NetworkLink(
        category=category,
        item_title=item_title,
        from_airport_key=from_key,
        to_airport_key=to_key,
        bidirectional=bidirectional,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def delete_link(db: Session, link: NetworkLink) -> None:
    db.delete(link)
    db.commit()


def delete_links_for_item(db: Session, category: NetworkCategoryEnum, item_title: str, airport_key: str) -> None:
    """Appelé quand un NetworkItem est supprimé (cf. crud/network.py::delete_item)."""
    links = db.scalars(
        select(NetworkLink).where(
            NetworkLink.category == category,
            NetworkLink.item_title == item_title,
            or_(NetworkLink.from_airport_key == airport_key, NetworkLink.to_airport_key == airport_key),
        )
    ).all()
    for link in links:
        db.delete(link)
    db.commit()


# ─── Paramètres de liaison ────────────────────────────────────────────────

def add_link_parameter(db: Session, link: NetworkLink, name: str) -> LinkParameter:
    param = LinkParameter(link_id=link.id, name=name)
    db.add(param)
    db.commit()
    db.refresh(param)
    return param


def get_link_parameter(db: Session, param_id: str) -> LinkParameter | None:
    return db.get(LinkParameter, param_id)


def delete_link_parameter(db: Session, param: LinkParameter) -> None:
    db.delete(param)
    db.commit()


def add_link_parameter_value(db: Session, param: LinkParameter, name: str, text: str) -> LinkParameterValue:
    value = LinkParameterValue(parameter_id=param.id, name=name, text=text)
    db.add(value)
    db.commit()
    db.refresh(value)
    return value


def get_link_parameter_value(db: Session, value_id: str) -> LinkParameterValue | None:
    return db.get(LinkParameterValue, value_id)


def delete_link_parameter_value(db: Session, value: LinkParameterValue) -> None:
    db.delete(value)
    db.commit()


# ─── Paramètres locaux d'un aéroport (module "Réseau local") ────────────

def add_local_parameter(db: Session, airport_key: str, name: str) -> AirportLocalParameter:
    param = AirportLocalParameter(airport_key=airport_key, name=name)
    db.add(param)
    db.commit()
    db.refresh(param)
    return param


def get_local_parameter(db: Session, param_id: str) -> AirportLocalParameter | None:
    return db.get(AirportLocalParameter, param_id)


def delete_local_parameter(db: Session, param: AirportLocalParameter) -> None:
    db.delete(param)
    db.commit()


def add_local_parameter_value(
    db: Session, param: AirportLocalParameter, name: str, text: str
) -> AirportLocalParameterValue:
    value = AirportLocalParameterValue(parameter_id=param.id, name=name, text=text)
    db.add(value)
    db.commit()
    db.refresh(value)
    return value


def get_local_parameter_value(db: Session, value_id: str) -> AirportLocalParameterValue | None:
    return db.get(AirportLocalParameterValue, value_id)


def delete_local_parameter_value(db: Session, value: AirportLocalParameterValue) -> None:
    db.delete(value)
    db.commit()
