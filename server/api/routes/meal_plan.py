import asyncio
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException

from api.middleware.auth_middleware import get_current_user
from config.firebase_config import get_db
from models.user import UserProfile
from services import (
    clinical_filter,
    firebase_service,
    gemini_service,
    lp_optimizer,
    nutrition_calculator,
    sequential_adapter,
    serialization,
)


router = APIRouter(prefix="/meal-plan")
FOOD_DB = pd.read_csv(
    Path(__file__).parent.parent.parent / "data" / "food_db_final.csv"
)


@router.post("/generate")
async def generate_meal_plan(user: dict = Depends(get_current_user)):
    profile = UserProfile(**user)
    db = get_db()
    actual_kcal = await sequential_adapter.get_yesterday_intake(user["uid"], db)
    targets = nutrition_calculator.compute_targets(profile, actual_kcal)
    safe_db = clinical_filter.apply(FOOD_DB, profile)
    if len(safe_db) < 4:
        raise HTTPException(
            status_code=422,
            detail="Too few foods after clinical filter",
        )

    result = lp_optimizer.optimize_meal_plan(profile, safe_db, None)
    result_dict = result.to_dict()
    profile_dict = profile.model_dump(mode="json")
    try:
        explanation = await asyncio.to_thread(
            gemini_service.generate_explanation, result_dict, profile_dict
        )
    except Exception:
        explanation = None
    result_dict["explanation"] = explanation
    result_dict = serialization.to_json_safe(result_dict)

    today_str = date.today().isoformat()
    await firebase_service.save_meal_plan(user["uid"], today_str, result_dict)
    return result_dict


@router.get("/today")
async def get_today_meal_plan(user: dict = Depends(get_current_user)):
    plan = await firebase_service.get_meal_plan(
        user["uid"], date.today().isoformat()
    )
    return plan if plan is not None else {"plan": None}


@router.get("/history")
async def get_meal_plan_history(user: dict = Depends(get_current_user)):
    dates = [date.today() - timedelta(days=offset) for offset in range(7)]
    plans = await asyncio.gather(
        *(
            firebase_service.get_meal_plan(user["uid"], day.isoformat())
            for day in dates
        )
    )
    return [plan for plan in plans if plan is not None]
