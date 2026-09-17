from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query

from api.middleware.auth_middleware import get_current_user


router = APIRouter(prefix="/nutrition")
FOOD_DB = pd.read_csv(
    Path(__file__).parent.parent.parent / "data" / "food_db_final.csv"
)
RESPONSE_COLUMNS = [
    "id",
    "name",
    "calories",
    "protein",
    "carbs",
    "fat",
    "fibre",
    "sodium",
    "meal_type",
    "is_vegetarian",
    "is_vegan",
    "allergens",
]


def _records(rows: pd.DataFrame) -> list[dict]:
    selected = rows[RESPONSE_COLUMNS].astype(object)
    return selected.where(pd.notna(selected), None).to_dict("records")


@router.get("/search")
async def search_foods(
    q: str = Query(...),
    user: dict = Depends(get_current_user),
):
    matches = FOOD_DB[
        FOOD_DB["name"].astype(str).str.contains(q, case=False, regex=False, na=False)
    ].head(10)
    return _records(matches)


@router.get("/food/{food_id}")
async def get_food(food_id: str):
    matches = FOOD_DB[FOOD_DB["id"].astype(str) == food_id]
    if matches.empty:
        raise HTTPException(status_code=404, detail="Food not found")
    return _records(matches.head(1))[0]
