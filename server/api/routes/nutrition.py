from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query

from api.middleware.auth_middleware import get_current_user
from services import firebase_service
from services.ai_safety import KEYWORDS


router = APIRouter(prefix="/nutrition")
FOOD_DB = pd.read_csv(
    Path(__file__).parent.parent.parent / "data" / "food_db_final.csv"
)
RESPONSE_COLUMNS = [
    "food_name",
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
ALLERGEN_KEYWORDS = {
    "dairy": [*KEYWORDS["dairy"], "dairy"],
    "gluten": [*KEYWORDS["gluten"], "gluten"],
    "nuts": [*KEYWORDS["nuts"], "nuts"],
    "eggs": [*KEYWORDS["eggs"], "eggs"],
    "fish": [*KEYWORDS["fish"], "fish", "shellfish", "seafood"],
    "legumes": [*KEYWORDS["legumes"], "legumes"],
}


def _as_bool(value) -> bool:
    return value is True or str(value).strip().lower() == "true"


def _profile_values(values) -> set[str]:
    return {str(getattr(value, "value", value)).strip().lower() for value in values or []}


def _is_allowed(row: pd.Series, profile: dict) -> bool:
    if profile.get("is_vegan") and not _as_bool(row.get("is_vegan")):
        return False
    if profile.get("is_vegetarian") and not _as_bool(row.get("is_vegetarian")):
        return False

    allergens = _profile_values(profile.get("allergens"))
    conditions = _profile_values(profile.get("medical_conditions"))
    if "lactose_intolerance" in conditions:
        allergens.add("dairy")
    if "gluten_intolerance" in conditions:
        allergens.add("gluten")

    searchable = f"{row.get('food_name', '')} {row.get('allergens', '')}".lower()
    return not any(
        keyword.lower() in searchable
        for allergen in allergens
        for keyword in ALLERGEN_KEYWORDS.get(allergen, [allergen])
    )


def _ranked_matches(query: str, profile: dict) -> pd.DataFrame:
    normalized = query.strip().lower()
    names = FOOD_DB["food_name"].fillna("").astype(str)
    lowered = names.str.lower()
    matches = FOOD_DB[lowered.str.contains(normalized, regex=False, na=False)].copy()
    if matches.empty:
        return matches
    matches = matches[matches.apply(lambda row: _is_allowed(row, profile), axis=1)]
    match_names = matches["food_name"].fillna("").astype(str).str.lower()
    matches["_rank"] = match_names.map(
        lambda name: 0
        if name == normalized
        else 1
        if name.startswith(normalized)
        else 2
        if any(word.startswith(normalized) for word in name.split())
        else 3
    )
    matches["_length"] = match_names.str.len()
    matches["_name_key"] = match_names
    return (
        matches.sort_values(["_rank", "_length", "food_name"])
        .drop_duplicates("_name_key")
        .head(10)
    )


def _records(rows: pd.DataFrame) -> list[dict]:
    selected = rows[RESPONSE_COLUMNS].astype(object)
    records = selected.where(pd.notna(selected), None).to_dict("records")
    for index, record in zip(rows.index, records):
        record["id"] = str(index)
        record["name"] = record.pop("food_name")
    return records


@router.get("/search")
async def search_foods(
    q: str = Query(..., min_length=1),
    user: dict = Depends(get_current_user),
):
    profile = await firebase_service.get_user_profile(user["uid"]) or {}
    matches = _ranked_matches(q, profile)
    return _records(matches)


@router.get("/food/{food_id}")
async def get_food(food_id: str):
    try:
        row_index = int(food_id)
        matches = FOOD_DB.loc[[row_index]]
    except (ValueError, KeyError):
        raise HTTPException(status_code=404, detail="Food not found")
    return _records(matches.head(1))[0]
