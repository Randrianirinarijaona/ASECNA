from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.crud.crud_user import get_user_by_username
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Identifiants incorrects")
    
    access_token = create_access_token(user.id)
    return {"access_token": access_token, "token_type": "bearer"}