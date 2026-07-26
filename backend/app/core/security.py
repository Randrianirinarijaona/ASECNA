"""
Sécurité : hachage bcrypt des mots de passe + création/validation des
tokens JWT (remplace le mock 'mock-jwt-token-<timestamp>' de AuthContext.tsx
par un vrai JWT signé, décodable par parseJwt() côté frontend sans
modification puisqu'on garde la structure standard header.payload.signature).
"""
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    """
    Le payload inclut `sub` et `role` pour rester compatible avec
    utils/jwt.ts -> parseJwt() (qui lit payload.sub, payload.role, payload.exp).
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        return None
