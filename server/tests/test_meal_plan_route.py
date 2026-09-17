import os
from types import SimpleNamespace

import pandas as pd
import pytest

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from api.routes import meal_plan


USER = {
    "uid": "user-1",
    "name": "Test User",
    "email": "test@example.com",
    "age": 30,
    "gender": "male",
    "weight_kg": 70,
    "height_cm": 175,
    "activity_level": "moderate",
    "goal": "maintenance",
    "medical_conditions": [],
    "allergens": [],
    "is_vegetarian": False,
    "is_vegan": False,
}


def install_route_dependencies(monkeypatch, gemini_error=False):
    calls = []
    db = object()
    safe_db = pd.DataFrame({"food_name": ["a", "b", "c", "d"]})

    async def yesterday(uid, received_db):
        calls.append("yesterday")
        assert uid == "user-1"
        assert received_db is db
        return 1600.0

    def targets(profile, actual_kcal):
        calls.append("targets")
        assert actual_kcal == 1600.0
        return object()

    def clinical(food_db, profile):
        calls.append("clinical")
        assert food_db is meal_plan.FOOD_DB
        return safe_db

    def optimize(profile, received_foods, received_targets):
        calls.append("optimizer")
        assert received_foods is safe_db
        assert received_targets is None
        return SimpleNamespace(
            to_dict=lambda: {
                "totals": {"calories": 1800},
                "meals": {"breakfast": []},
            }
        )

    def explain(result, profile_dict):
        calls.append("gemini")
        assert result["totals"]["calories"] == 1800
        assert profile_dict["uid"] == "user-1"
        if gemini_error:
            raise RuntimeError("Gemini unavailable")
        return {"calorie_reason": "Close to target"}

    async def save(uid, today, result):
        calls.append("save")
        assert uid == "user-1"
        assert result["totals"]["calories"] == 1800

    monkeypatch.setattr(meal_plan, "get_db", lambda: db)
    monkeypatch.setattr(meal_plan.sequential_adapter, "get_yesterday_intake", yesterday)
    monkeypatch.setattr(meal_plan.nutrition_calculator, "compute_targets", targets)
    monkeypatch.setattr(meal_plan.clinical_filter, "apply", clinical)
    monkeypatch.setattr(meal_plan.lp_optimizer, "optimize_meal_plan", optimize)
    monkeypatch.setattr(meal_plan.gemini_service, "generate_explanation", explain)
    monkeypatch.setattr(meal_plan.firebase_service, "save_meal_plan", save)
    return calls


@pytest.mark.asyncio
async def test_generate_meal_plan_runs_pipeline_in_exact_order(monkeypatch):
    calls = install_route_dependencies(monkeypatch)

    result = await meal_plan.generate_meal_plan(USER)

    assert calls == ["yesterday", "targets", "clinical", "optimizer", "gemini", "save"]
    assert result["explanation"] == {"calorie_reason": "Close to target"}
    assert "targets" not in result


@pytest.mark.asyncio
async def test_generate_meal_plan_saves_when_gemini_fails(monkeypatch):
    calls = install_route_dependencies(monkeypatch, gemini_error=True)

    result = await meal_plan.generate_meal_plan(USER)

    assert calls[-2:] == ["gemini", "save"]
    assert result["explanation"] is None


@pytest.mark.asyncio
async def test_generate_meal_plan_rejects_too_few_safe_foods(monkeypatch):
    async def yesterday(uid, db):
        return None

    monkeypatch.setattr(meal_plan, "get_db", object)
    monkeypatch.setattr(meal_plan.sequential_adapter, "get_yesterday_intake", yesterday)
    monkeypatch.setattr(meal_plan.nutrition_calculator, "compute_targets", lambda *args: object())
    monkeypatch.setattr(
        meal_plan.clinical_filter,
        "apply",
        lambda *args: pd.DataFrame({"food_name": ["a", "b", "c"]}),
    )

    with pytest.raises(meal_plan.HTTPException) as error:
        await meal_plan.generate_meal_plan(USER)

    assert error.value.status_code == 422


@pytest.mark.asyncio
async def test_today_returns_plan_or_empty_shape(monkeypatch):
    async def get_plan(uid, today):
        return None

    monkeypatch.setattr(meal_plan.firebase_service, "get_meal_plan", get_plan)

    assert await meal_plan.get_today_meal_plan(USER) == {"plan": None}
