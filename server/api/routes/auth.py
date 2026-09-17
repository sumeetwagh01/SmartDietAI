import httpx
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth

from api.middleware.auth_middleware import get_current_user
from config.settings import settings
from models.user import ProfileUpdate, UserLogin, UserRegister
from services import firebase_service


router = APIRouter(prefix="/auth")


@router.post("/register")
async def register(body: UserRegister):
    try:
        firebase_user = auth.create_user(email=body.email, password=body.password)
        profile = {
            "uid": firebase_user.uid,
            "name": body.name,
            "email": body.email,
        }
        await firebase_service.save_user_profile(firebase_user.uid, profile)
        return {"uid": firebase_user.uid, "message": "registered"}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login")
async def login(body: UserLogin):
    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={settings.FIREBASE_WEB_API_KEY}"
    )
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            json={
                "email": body.email,
                "password": body.password,
                "returnSecureToken": True,
            },
        )
    if response.is_error:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    payload = response.json()
    return {"token": payload["idToken"], "uid": payload["localId"]}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/me")
async def update_me(
    body: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = body.model_dump(exclude_none=True)
    updated_profile = {**current_user, **updates}
    await firebase_service.save_user_profile(current_user["uid"], updated_profile)
    return updated_profile
