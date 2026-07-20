from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user_in: UserCreate):
    hashed = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user