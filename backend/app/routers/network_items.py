from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud import airport as airport_crud
from app.crud import link as link_crud
from app.crud import network as network_crud
from app.database import get_db
from app.dependencies import get_current_user, require_write_access
from app.models.network import NetworkCategoryEnum
from app.models.user import User
from app.schemas.network import NetworkItemCreate, NetworkItemUpdate, NetworkItemOut, SubParameterCreate, SubParameterOut, AirportNetworkMatchOut
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/network", tags=["Network Items"])


def _to_item_out(item) -> NetworkItemOut:
    return NetworkItemOut(id=item.id, airport_key=item.airport_key, category=item.category, title=item.title, description=item.description, details=item.details, status=item.status, sub_parameters=[SubParameterOut.model_validate(s) for s in item.sub_parameters])


@router.post("/airports/{airport_key}/{category}/items", response_model=NetworkItemOut, status_code=status.HTTP_201_CREATED)
def add_item(airport_key: str, category: NetworkCategoryEnum, payload: NetworkItemCreate, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    airport = airport_crud.get_airport(db, airport_key)
    if not airport:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    item = network_crud.add_item(db, airport, category, payload.title, payload.status.value if payload.status else None, payload.description, payload.details)
    return _to_item_out(item)


@router.delete("/airports/{airport_key}/{category}/items/{title}", response_model=MessageResponse)
def delete_item(airport_key: str, category: NetworkCategoryEnum, title: str, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    item = network_crud.get_item(db, airport_key, category, title)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    link_crud.delete_links_for_item(db, category, title, airport_key)
    network_crud.delete_item(db, item)
    return MessageResponse(message="Paramètre supprimé")


@router.patch("/items/{item_id}", response_model=NetworkItemOut)
def update_item(item_id: str, payload: NetworkItemUpdate, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    item = network_crud.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    if payload.title is not None:
        item.title = payload.title
    if payload.status is not None:
        network_crud.update_status(db, item, payload.status.value)
    if payload.description is not None:
        network_crud.update_description(db, item, payload.description)
    db.commit()
    db.refresh(item)
    return _to_item_out(item)


@router.post("/items/{item_id}/sub-parameters", response_model=SubParameterOut, status_code=status.HTTP_201_CREATED)
def add_sub_parameter(item_id: str, payload: SubParameterCreate, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    item = network_crud.get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    sub = network_crud.add_sub_parameter(db, item, payload.title, payload.value)
    return SubParameterOut.model_validate(sub)


@router.delete("/sub-parameters/{sub_id}", response_model=MessageResponse)
def delete_sub_parameter(sub_id: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    sub = network_crud.get_sub_parameter(db, sub_id)
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sous-paramètre introuvable")
    network_crud.delete_sub_parameter(db, sub)
    return MessageResponse(message="Sous-paramètre supprimé")


@router.patch("/sub-parameters/{sub_id}/toggle-status", response_model=SubParameterOut)
def toggle_sub_parameter_status(sub_id: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    sub = network_crud.get_sub_parameter(db, sub_id)
    if not sub:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sous-paramètre introuvable")
    return SubParameterOut.model_validate(network_crud.toggle_sub_parameter_status(db, sub))


@router.get("/usage/{category}/{sub_item}", response_model=list[AirportNetworkMatchOut])
def get_network_usage(category: NetworkCategoryEnum, sub_item: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return network_crud.get_airports_by_network(db, category, sub_item)
