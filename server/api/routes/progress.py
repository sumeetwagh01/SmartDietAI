import asyncio
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from api.middleware.auth_middleware import get_current_user
from services import firebase_service


router = APIRouter(prefix="/progress")


class WeightEntry(BaseModel):
    weight_kg: float
    date: str


@router.get("/")
async def get_progress(
    from_date: str = Query(...),
    to_date: str = Query(...),
    user: dict = Depends(get_current_user),
):
    try:
        start = date.fromisoformat(from_date)
        end = date.fromisoformat(to_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD") from exc
    if end < start:
        raise HTTPException(status_code=400, detail="to_date must not precede from_date")

    days = [
        start + timedelta(days=offset)
        for offset in range((end - start).days + 1)
    ]
    logs = await asyncio.gather(
        *(
            firebase_service.get_food_log(user["uid"], day.isoformat())
            for day in days
        )
    )
    return [
        {
            "date": day.isoformat(),
            "total_calories": log.get("total_calories", 0),
            "total_protein_g": log.get("total_protein", 0),
            "total_carbs_g": log.get("total_carbs", 0),
            "total_fat_g": log.get("total_fat", 0),
        }
        for day, log in zip(days, logs)
        if log is not None
    ]


@router.post("/weight")
async def add_weight(
    body: WeightEntry,
    user: dict = Depends(get_current_user),
):
    weight_history = user.get("weight_history", [])
    weight_history.append(body.model_dump())
    updated_profile = {**user, "weight_history": weight_history}
    await firebase_service.save_user_profile(user["uid"], updated_profile)
    return body.model_dump()


@router.get("/weight")
async def get_weight_history(user: dict = Depends(get_current_user)):
    return user.get("weight_history", [])
