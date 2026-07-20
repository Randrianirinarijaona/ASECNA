from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.network_link import NetworkLink
from app.models.airport import Airport
from app.schemas.network import (
    NetworkLinkCreate, 
    NetworkLinkRead, 
    LinkParameterCreate,
    LinkParameterRead
)
from app.crud.crud_network_link import (
    create_link, 
    get_links_by_category, 
    delete_link,
    add_link_parameter,
    add_link_parameter_value
)

router = APIRouter()

@router.post("/", response_model=NetworkLinkRead)
def create_network_link(
    link_in: NetworkLinkCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Vérification des droits (technicien ou admin)
    if current_user.role == "user":
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Vérifier que les aéroports existent
    if not db.query(Airport).filter(Airport.iata == link_in.from_airport_iata).first():
        raise HTTPException(status_code=404, detail="Aéroport de départ introuvable")
    if not db.query(Airport).filter(Airport.iata == link_in.to_airport_iata).first():
        raise HTTPException(status_code=404, detail="Aéroport d'arrivée introuvable")

    return create_link(db, link_in)


@router.get("/by-category/{category}", response_model=List[NetworkLinkRead])
def read_links_by_category(
    category: str,
    db: Session = Depends(get_db)
):
    return get_links_by_category(db, category)


@router.delete("/{link_id}")
def delete_network_link(
    link_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if current_user.role == "user":
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    success = delete_link(db, link_id)
    if not success:
        raise HTTPException(status_code=404, detail="Liaison non trouvée")
    return {"detail": "Liaison supprimée avec succès"}


# Paramètres de liaison
@router.post("/{link_id}/parameters", response_model=LinkParameterRead)
def create_link_parameter(
    link_id: str,
    param_in: LinkParameterCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if current_user.role == "user":
        raise HTTPException(status_code=403, detail="Accès refusé")
    return add_link_parameter(db, link_id, param_in)


@router.post("/{link_id}/parameters/{param_id}/values")
def add_parameter_value(
    link_id: str,
    param_id: str,
    value_in: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if current_user.role == "user":
        raise HTTPException(status_code=403, detail="Accès refusé")
    return add_link_parameter_value(db, param_id, value_in)