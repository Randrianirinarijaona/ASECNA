from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud import airport as airport_crud
from app.crud import link as link_crud
from app.crud import user as user_crud
from app.database import get_db
from app.dependencies import get_current_user, require_write_access, require_admin
from app.models.network import NetworkCategoryEnum
from app.models.user import User
from app.schemas.airport import AirportCreate, AirportUpdate, TechnicalPointCreate, AirportOut, AirportSummaryOut, ParameterOut, ParameterCreate, ParameterValueOut, ParameterValueCreate
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/airports", tags=["Airports"])


@router.get("", response_model=list[AirportOut])
def list_airports(technical: bool | None = None, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return airport_crud.list_airports_out(db, technical_only=technical)


@router.get("/{key}", response_model=AirportOut)
def get_airport(key: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    airport = airport_crud.get_airport_out(db, key)
    if not airport:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    return airport


@router.post("", response_model=AirportOut, status_code=status.HTTP_201_CREATED)
def create_airport(payload: AirportCreate, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    """MODIFIÉ : `payload.iata` est désormais optionnel (peut être None ou
    vide) — normalisé en chaîne vide plutôt que de lever une erreur."""
    key = payload.key.strip().upper()
    if airport_crud.get_airport(db, key):
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f'La clé "{key}" est déjà utilisée par un autre aéroport')
    iata = (payload.iata or "").strip().upper()
    airport_crud.create_airport(db, key, payload.name, iata, payload.lat, payload.lng)
    return airport_crud.get_airport_out(db, key)


@router.patch("/{key}", response_model=AirportOut)
def update_airport(
    key: str,
    payload: AirportUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """NOUVEAU : modification du nom / code IATA d'un aéroport, réservée à
    l'administrateur (NetworkModal.tsx). La clé de l'aéroport ne change
    jamais, seuls `name` et `iata` sont éditables."""
    airport = airport_crud.get_airport(db, key)
    if not airport:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")

    name = payload.name.strip() if payload.name is not None else None
    if name is not None and not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Le nom de l'aéroport ne peut pas être vide")
    iata = payload.iata.strip().upper() if payload.iata is not None else None

    airport_crud.update_airport(db, airport, name=name, iata=iata)
    user_crud.log_activity(db, current_user, f"Modification de l'aéroport {key} (nom/IATA)")
    return airport_crud.get_airport_out(db, key)


@router.delete("/{key}", response_model=MessageResponse)
def delete_airport(key: str, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    airport = airport_crud.get_airport(db, key)
    if not airport:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    airport_crud.delete_airport(db, airport)
    return MessageResponse(message="Aéroport supprimé")


@router.post("/technical-points/{category}/{sub_item}", response_model=AirportOut, status_code=status.HTTP_201_CREATED)
def create_technical_point(category: NetworkCategoryEnum, sub_item: str, payload: TechnicalPointCreate, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    airport = airport_crud.create_technical_point(db, category, sub_item, payload.name, payload.lat, payload.lng)
    return airport_crud.get_airport_out(db, airport.key)


@router.post("/{key}/local-network", response_model=AirportSummaryOut)
def add_to_local_network(key: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    airport = airport_crud.get_airport(db, key)
    if not airport:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    return airport_crud.summarize(airport_crud.set_local_network_membership(db, airport, True))


@router.delete("/{key}/local-network", response_model=AirportSummaryOut)
def remove_from_local_network(key: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    airport = airport_crud.get_airport(db, key)
    if not airport:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    return airport_crud.summarize(airport_crud.set_local_network_membership(db, airport, False))


@router.post("/{key}/local-parameters", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
def add_local_parameter(key: str, payload: ParameterCreate, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    if not airport_crud.get_airport(db, key):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    param = link_crud.add_local_parameter(db, key, payload.name)
    return ParameterOut(id=param.id, name=param.name, values=[])


@router.delete("/local-parameters/{param_id}", response_model=MessageResponse)
def delete_local_parameter(param_id: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    param = link_crud.get_local_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    link_crud.delete_local_parameter(db, param)
    return MessageResponse(message="Paramètre supprimé")


@router.post("/local-parameters/{param_id}/values", response_model=ParameterValueOut, status_code=status.HTTP_201_CREATED)
def add_local_parameter_value(param_id: str, payload: ParameterValueCreate, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    param = link_crud.get_local_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    value = link_crud.add_local_parameter_value(db, param, payload.name, payload.text)
    return ParameterValueOut.model_validate(value)


@router.delete("/local-parameters/values/{value_id}", response_model=MessageResponse)
def delete_local_parameter_value(value_id: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    value = link_crud.get_local_parameter_value(db, value_id)
    if not value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Valeur introuvable")
    link_crud.delete_local_parameter_value(db, value)
    return MessageResponse(message="Valeur supprimée")