import math
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, RoleEnum
from app.models.log import ActivityLog


def get_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username.lower()))


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def authenticate(db: Session, username: str, password: str) -> User | None:
    user = get_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(
    db: Session, username: str, password: str, role: RoleEnum, email: str | None = None
) -> User:
    user = User(
        username=username.lower(),
        email=email,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def touch_last_login(db: Session, user: User) -> User:
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, page: int, page_size: int, search: str = "") -> tuple[list[User], int]:
    query = select(User)
    count_query = select(func.count()).select_from(User)
    if search:
        like = f"%{search}%"
        query = query.where(User.username.ilike(like))
        count_query = count_query.where(User.username.ilike(like))

    total = db.scalar(count_query) or 0
    items = db.scalars(
        query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(items), total


def update_user(db: Session, user: User, **fields) -> User:
    for key, value in fields.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def change_password(db: Session, user: User, new_password: str) -> None:
    user.hashed_password = hash_password(new_password)
    db.commit()


def log_activity(db: Session, user: User | None, action: str, details: str | None = None) -> None:
    entry = ActivityLog(
        user_id=user.id if user else None,
        username=user.username if user else "system",
        action=action,
        details=details,
    )
    db.add(entry)
    db.commit()


def paginate_meta(total: int, page: int, page_size: int) -> int:
    return max(1, math.ceil(total / page_size)) if page_size else 1
