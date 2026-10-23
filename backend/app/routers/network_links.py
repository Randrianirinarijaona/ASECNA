from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import link as link_crud
from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import get_current_user, require_write_access, require_admin
from app.models.link import LinkDirectionEnum
from app.models.network import NetworkCategoryEnum
from app.models.user import User
from app.schemas.airport import (
    LinkCreate,
    LinkUpdate,
    LinkOut,
    LinkStatusUpdate,
    ParameterOut,
    ParameterCreate,
    ParameterUpdate,
    ParameterValueOut,
    ParameterValueCreate,
    ParameterValueUpdate,
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
        direction=link.direction.value,
        link_type=link.link_type,
        circuit=link.circuit,
        ip_address=link.ip_address,
        port=link.port,
        status=link.status.value,
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
    try:
        category_enum = NetworkCategoryEnum(payload.category)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Catégorie invalide")

    link = link_crud.create_link(
        db, category_enum, payload.item_title, payload.from_airport_key, payload.to_airport_key,
        direction=payload.direction, link_type=payload.link_type, circuit=payload.circuit,
        ip_address=payload.ip_address, port=payload.port,
    )
    user_crud.log_activity(
        db, current_user,
        f"Création d'une liaison {payload.item_title} entre {payload.from_airport_key} et {payload.to_airport_key}",
    )
    return _to_link_out(link)


@router.get("/{link_id}", response_model=LinkOut)
def get_link(link_id: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")
    return _to_link_out(link)


@router.patch("/{link_id}", response_model=LinkOut)
def update_link(
    link_id: str,
    payload: LinkUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """NOUVEAU : modification de la direction, du type, du circuit, de
    l'@IP et du port d'une liaison existante (administrateur uniquement).
    Seuls les champs envoyés sont modifiés ; type et circuit peuvent être
    vidés en envoyant une chaîne vide, l'@IP et le port restent
    obligatoires."""
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")

    fields = payload.model_dump(exclude_unset=True)
    updates: dict = {}

    if fields.get("direction") is not None:
        try:
            updates["direction"] = LinkDirectionEnum(fields["direction"])
        except ValueError:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Direction invalide (valeurs acceptées : incoming, outgoing, both)",
            )

    for key in ("link_type", "circuit"):
        if key in fields:
            value = (fields[key] or "").strip()
            updates[key] = value or None

    for key, label in (("ip_address", "L'adresse IP"), ("port", "Le port")):
        if key in fields:
            value = (fields[key] or "").strip()
            if not value:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"{label} est obligatoire")
            updates[key] = value

    updated = link_crud.update_link(db, link, updates)
    user_crud.log_activity(db, current_user, f"Modification des informations de la liaison {link_id}")
    return _to_link_out(updated)


@router.patch("/{link_id}/status", response_model=LinkOut)
def update_link_status(
    link_id: str,
    payload: LinkStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    link = link_crud.get_link(db, link_id)
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Liaison introuvable")
    updated = link_crud.update_status(db, link, payload.status)
    user_crud.log_activity(db, current_user, f"Changement de statut de la liaison {link_id} -> {payload.status}")
    return _to_link_out(updated)


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
    user_crud.log_activity(db, current_user, f"Suppression de la liaison {link_id}")
    return MessageResponse(message="Liaison supprimée")


# ─── Paramètres de liaison (LinkDetailModal.tsx) ─────────────────────────

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


@router.patch("/parameters/{param_id}", response_model=ParameterOut)
def update_parameter(
    param_id: str,
    payload: ParameterUpdate,
    _: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    param = link_crud.get_link_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Le nom du paramètre ne peut pas être vide")
        link_crud.update_link_parameter(db, param, name)
    return ParameterOut(
        id=param.id, name=param.name,
        values=[ParameterValueOut.model_validate(v) for v in param.values],
    )


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


@router.patch("/parameters/values/{value_id}", response_model=ParameterValueOut)
def update_parameter_value(
    value_id: str,
    payload: ParameterValueUpdate,
    _: User = Depends(require_write_access),
    db: Session = Depends(get_db),
):
    value = link_crud.get_link_parameter_value(db, value_id)
    if not value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Valeur introuvable")

    name = payload.name.strip() if payload.name is not None else None
    if name is not None and not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Le nom de la valeur ne peut pas être vide")
    text = payload.text.strip() if payload.text is not None else None
    if text is not None and not text:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="La valeur ne peut pas être vide")

    updated = link_crud.update_link_parameter_value(db, value, name, text)
    return ParameterValueOut.model_validate(updated)


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