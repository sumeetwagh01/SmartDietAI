import json
import os

import pytest

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from models.ai_plan import AiPreferences
from services import ai_nutrition_service


PROFILE = {"age": 30, "gender": "female", "height_cm": 165, "weight_kg": 60, "activity_level": "moderate", "goal": "maintenance", "medical_conditions": [], "allergens": ["dairy"], "is_vegetarian": False, "is_vegan": False}
TARGETS = {"calories": 1800, "protein_g": 90, "carbs_g": 225, "fat_g": 60, "fibre_g": 30, "water_ml": 2200, "calculation": {"bmr_kcal": 1400, "tdee_kcal": 1800, "goal_adjustment_kcal": 0, "method": "Mifflin-St Jeor"}, "rationale": "Maintenance target.", "cautions": []}


def item(name, ingredients):
    return {"name": name, "quantity": 1, "unit": "katori", "grams": 200, "calories": 450, "protein_g": 22.5, "carbs_g": 56.25, "fat_g": 15, "fibre_g": 7.5, "sodium_mg": 200, "ingredients": ingredients, "prep_note": "Cook gently."}


def response(first):
    items = [first, item("Rice Bowl", ["rice"]), item("Fruit Bowl", ["apple"]), item("Millet Bowl", ["millet"])]
    return json.dumps({"meals": {"breakfast": [items[0]], "lunch": [items[1]], "snacks": [items[2]], "dinner": [items[3]]}, "why_this_plan": {"calories": "On target", "protein": "Balanced", "conditions": "Safety checked", "preferences": "Indian foods"}, "tips": [], "cautions": []})


@pytest.mark.asyncio
async def test_unsafe_plan_is_retried_then_safe_plan_returned(monkeypatch):
    calls = []
    answers = [response(item("Paneer Tikka", ["paneer"])), response(item("Poha", ["rice flakes"]))]

    async def fake_call(*args):
        calls.append(args)
        return answers[len(calls) - 1]

    monkeypatch.setattr(ai_nutrition_service, "_call_gemini", fake_call)
    result = await ai_nutrition_service.generate_meal_plan(PROFILE, AiPreferences(), TARGETS, "2026-10-27")
    assert len(calls) == 2
    assert result["meals"]["breakfast"][0]["name"] == "Poha"
    assert result["safety"]["checked"] is True


@pytest.mark.asyncio
async def test_three_unsafe_plans_raise_safe_error(monkeypatch):
    async def fake_call(*args):
        return response(item("Paneer Tikka", ["paneer"]))

    monkeypatch.setattr(ai_nutrition_service, "_call_gemini", fake_call)
    with pytest.raises(ai_nutrition_service.AiGenerationError, match="safe result"):
        await ai_nutrition_service.generate_meal_plan(PROFILE, AiPreferences(), TARGETS, "2026-10-27")
