from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import link as link_crud
from app.database import get_db
from app.dependencies import get_current_user, require_write_access, require_admin
from app.models.user import User
from app.schemas.airport import (
    LinkCreate,
    LinkOut,
    LinkStatusUpdate,
    ParameterOut,
    ParameterCreate,
    ParameterValueOut,
    ParameterValueCreate,
)
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/links", tags=["Network Links"])


def _to_link_out(link) -> LinkOut:
    return LinkOut(
        id=link.id,
        category=link.category.value,
        item_title=link.item_title,
        from_airport_key=link.from_airport_key,
        to_airport_key=link.to_airport_key,
        direction=link.direction,
        link_type=link.link_type,
        circuit=link.circuit,
        ip_address=link.ip_address,
        port=link.port,
        status=link.status,
        parameters=[
            ParameterOut(id=p.id, name=p.name, values=[ParameterValueOut.model_validate(v) for v in p.values])
            for p in link.parameters
        ],
    )


@router.get("", response_model=list[LinkOut])
def list_links(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_to_link_out(l) for l in link_crud.list_links(db)]


@router.post("", response_model=LinkOut, status_code=status.HTTP_201_CREATED)
def create_link(
    payload: LinkCreate,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    """
    MODIFIÉ : transmet désormais direction/type/circuit/ip/port. La
    contrainte "départ = Antananarivo" est vérifiée dans crud.link.create_link
    (source de vérité unique, appliquée même si le frontend est contourné).
    """
    from app.models.network import NetworkCategoryEnum

    try:
        category_enum = NetworkCategoryEnum(payload.category)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Catégorie invalide")

    link = link_crud.create_link(
        db,
        category_enum,
        payload.item_title,
        payload.from_airport_key,
        payload.to_airport_key,
        direction=payload.direction,
        link_type=payload.link_type,
        circuit=payload.circuit,
        ip_address=payload.ip_address,
        port=payload.port,
    )
    return _to_link_out(link)


@router.get("/{link_id}", response_model=LinkOut)
def get_link(link_id: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")
    return _to_link_out(link)


@router.delete("/{link_id}", response_model=MessageResponse)
def delete_link(
    link_id: str,
    current_user: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")
    link_crud.delete_link(db, link)
    return MessageResponse(message="Liaison supprimée")


# NOUVEAU : modification de l'état d'une liaison (LinkDetailModal.tsx),
# réservé aux administrateurs (point 4 de la demande).
@router.patch("/{link_id}/status", response_model=LinkOut)
def update_link_status(
    link_id: str,
    payload: LinkStatusUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")
    updated = link_crud.update_status(db, link, payload.status.value)
    return _to_link_out(updated)


# ─── Paramètres de liaison (inchangé) ────────────────────────────────────

@router.post("/{link_id}/parameters", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
def add_parameter(
    link_id: str,
    payload: ParameterCreate,
    _: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")
    param = link_crud.add_link_parameter(db, link, payload.name)
    return ParameterOut(id=param.id, name=param.name, values=[])


@router.delete("/parameters/{param_id}", response_model=MessageResponse)
def delete_parameter(
    param_id: str,
    _: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    param = link_crud.get_link_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    link_crud.delete_link_parameter(db, param)
    return MessageResponse(message="Paramètre supprimé")


@router.post("/parameters/{param_id}/values", response_model=ParameterValueOut, status_code=status.HTTP_201_CREATED)
def add_parameter_value(
    param_id: str,
    payload: ParameterValueCreate,
    _: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    param = link_crud.get_link_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    value = link_crud.add_link_parameter_value(db, param, payload.name, payload.text)
    return ParameterValueOut.model_validate(value)


@router.delete("/parameters/values/{value_id}", response_model=MessageResponse)
def delete_parameter_value(
    value_id: str,
    _: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    value = link_crud.get_link_parameter_value(db, value_id)
    if not value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Valeur introuvable")
    link_crud.delete_link_parameter_value(db, value)
    return MessageResponse(message="Valeur supprimée")
