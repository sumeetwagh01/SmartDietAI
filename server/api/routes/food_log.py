from fastapi import APIRouter, Depends, HTTPException

from api.middleware.auth_middleware import get_current_user
from models.food_log import FoodLogCreate
from services import firebase_service


router = APIRouter(prefix="/food-log")


def _totals(entries: list[dict]) -> dict:
    return {
        "total_calories": sum(entry.get("calories", 0) for entry in entries),
        "total_protein": sum(entry.get("protein", 0) for entry in entries),
        "total_carbs": sum(entry.get("carbs", 0) for entry in entries),
        "total_fat": sum(entry.get("fat", 0) for entry in entries),
        "total_sodium": sum(entry.get("sodium", 0) for entry in entries),
    }


@router.post("/")
async def create_food_log(
    body: FoodLogCreate,
    user: dict = Depends(get_current_user),
):
    date_str = body.date.isoformat()
    entries = [entry.model_dump() for entry in body.entries]
    totals = _totals(entries)
    log = {
        "id": f'{user["uid"]}_{date_str}',
        "uid": user["uid"],
        "date": body.date,
        "meal_type": body.meal_type,
        "entries": entries,
        **totals,
    }
    await firebase_service.save_food_log(user["uid"], date_str, log)
    return totals


@router.get("/{date_str}")
async def get_food_log(
    date_str: str,
    user: dict = Depends(get_current_user),
):
    log = await firebase_service.get_food_log(user["uid"], date_str)
    return log if log is not None else {"entries": [], **_totals([])}


@router.delete("/{date_str}/{entry_index}")
async def delete_food_log_entry(
    date_str: str,
    entry_index: int,
    user: dict = Depends(get_current_user),
):
    log = await firebase_service.get_food_log(user["uid"], date_str)
    if log is None:
        raise HTTPException(status_code=404, detail="Food log not found")

    entries = log.get("entries", [])
    if entry_index < 0 or entry_index >= len(entries):
        raise HTTPException(status_code=404, detail="Food entry not found")
    entries.pop(entry_index)
    log["entries"] = entries
    log.update(_totals(entries))
    await firebase_service.save_food_log(user["uid"], date_str, log)
    return log
