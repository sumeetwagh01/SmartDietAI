from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user_schema import UserCreate, UserLogin

router = APIRouter()

@router.post("/register")
def register(user: UserCreate):
    # TODO: hash password, save to DB
    return {"message": "User registered", "email": user.email}

@router.post("/login")
def login(user: UserLogin):
    # TODO: verify credentials, return JWT
    return {"access_token": "placeholder_token", "token_type": "bearer"}
