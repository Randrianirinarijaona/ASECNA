from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud import airport as airport_crud
from app.crud import local_point as point_crud
from app.database import get_db
from app.dependencies import get_current_user, require_write_access
from app.models.user import User
from app.schemas.airport import ParameterOut, ParameterCreate, ParameterValueOut, ParameterValueCreate
from app.schemas.local_point import LocalTechnicalPointCreate, LocalTechnicalPointOut
from app.schemas.user import MessageResponse

router = APIRouter(prefix="/local-points", tags=["Local Technical Points"])


def _to_point_out(point) -> LocalTechnicalPointOut:
    return LocalTechnicalPointOut(id=point.id, parent_airport_key=point.parent_airport_key, name=point.name, coords=(point.lat, point.lng), local_parameters=[ParameterOut(id=p.id, name=p.name, values=[ParameterValueOut.model_validate(v) for v in p.values]) for p in point.local_parameters])


@router.get("/airport/{airport_key}", response_model=list[LocalTechnicalPointOut])
def list_points(airport_key: str, _: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_to_point_out(p) for p in point_crud.list_for_airport(db, airport_key)]


@router.post("/airport/{airport_key}", response_model=LocalTechnicalPointOut, status_code=status.HTTP_201_CREATED)
def create_point(airport_key: str, payload: LocalTechnicalPointCreate, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    if not airport_crud.get_airport(db, airport_key):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aéroport introuvable")
    point = point_crud.create_point(db, airport_key, payload.name, payload.lat, payload.lng)
    return _to_point_out(point)


@router.delete("/{point_id}", response_model=MessageResponse)
def delete_point(point_id: str, current_user: User = Depends(require_write_access), db: Session = Depends(get_db)):
    point = point_crud.get_point(db, point_id)
    if not point:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Point technique introuvable")
    point_crud.delete_point(db, point)
    return MessageResponse(message="Point technique supprimé")


@router.post("/{point_id}/parameters", response_model=ParameterOut, status_code=status.HTTP_201_CREATED)
def add_parameter(point_id: str, payload: ParameterCreate, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    point = point_crud.get_point(db, point_id)
    if not point:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Point technique introuvable")
    param = point_crud.add_parameter(db, point, payload.name)
    return ParameterOut(id=param.id, name=param.name, values=[])


@router.delete("/parameters/{param_id}", response_model=MessageResponse)
def delete_parameter(param_id: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    param = point_crud.get_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    point_crud.delete_parameter(db, param)
    return MessageResponse(message="Paramètre supprimé")


@router.post("/parameters/{param_id}/values", response_model=ParameterValueOut, status_code=status.HTTP_201_CREATED)
def add_parameter_value(param_id: str, payload: ParameterValueCreate, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    param = point_crud.get_parameter(db, param_id)
    if not param:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Paramètre introuvable")
    value = point_crud.add_parameter_value(db, param, payload.name, payload.text)
    return ParameterValueOut.model_validate(value)


@router.delete("/parameters/values/{value_id}", response_model=MessageResponse)
def delete_parameter_value(value_id: str, _: User = Depends(require_write_access), db: Session = Depends(get_db)):
    value = point_crud.get_parameter_value(db, value_id)
    if not value:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Valeur introuvable")
    point_crud.delete_parameter_value(db, value)
    return MessageResponse(message="Valeur supprimée")
