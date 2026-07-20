from sqlalchemy.orm import Session
from app.models.network_link import NetworkLink
from app.schemas.network import NetworkLinkCreate

def create_link(db: Session, link_in: NetworkLinkCreate):
    db_link = NetworkLink(
        category=link_in.category,
        item_title=link_in.item_title,
        from_airport_iata=link_in.from_airport_iata,
        to_airport_iata=link_in.to_airport_iata,
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def get_links_by_category(db: Session, category: str):
    return db.query(NetworkLink).filter(NetworkLink.category == category).all()

def delete_link(db: Session, link_id: str):
    link = db.query(NetworkLink).filter(NetworkLink.id == link_id).first()
    if link:
        db.delete(link)
        db.commit()
        return True
    return False