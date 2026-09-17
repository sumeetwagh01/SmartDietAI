from fastapi import Header, HTTPException
from firebase_admin import auth

from services import firebase_service


async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        profile = await firebase_service.get_user_profile(uid)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid authorization token") from exc

    if profile is None:
        raise HTTPException(status_code=401, detail="User profile not found")
    profile["uid"] = uid
    return profile
