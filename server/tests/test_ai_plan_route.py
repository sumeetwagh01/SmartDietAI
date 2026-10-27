import pytest
import os

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from api.routes import ai_plan
from datetime import date

from fastapi import HTTPException

from models.ai_plan import AiPreferences, GenerateMealPlanRequest, GenerateTargetsRequest


PROFILE = {"age": 30, "gender": "female", "height_cm": 165, "weight_kg": 60, "activity_level": "moderate", "goal": "maintenance", "medical_conditions": [], "allergens": [], "is_vegetarian": False, "is_vegan": False}
TARGETS = {"calories": 1800, "protein_g": 90, "carbs_g": 225, "fat_g": 60, "fibre_g": 30, "water_ml": 2200, "calculation": {"bmr_kcal": 1400, "tdee_kcal": 1800, "goal_adjustment_kcal": 0, "method": "test"}, "rationale": "test", "cautions": []}


@pytest.mark.asyncio
async def test_target_cache_skips_gemini(monkeypatch):
    preferences = AiPreferences()
    expected_hash = ai_plan.profile_hash(PROFILE, preferences)
    async def get_profile(uid): return PROFILE
    async def get_targets(uid): return {"targets": TARGETS, "profile_hash": expected_hash, "preferences": preferences.model_dump(mode="json")}
    async def should_not_call(*args): raise AssertionError("Gemini must not be called")
    monkeypatch.setattr(ai_plan.firebase_service, "get_user_profile", get_profile)
    monkeypatch.setattr(ai_plan.firebase_service, "get_ai_targets", get_targets)
    monkeypatch.setattr(ai_plan.ai_nutrition_service, "generate_targets", should_not_call)
    result = await ai_plan.generate_targets(GenerateTargetsRequest(), {"uid": "user-1"})
    assert result == TARGETS


@pytest.mark.asyncio
async def test_get_targets_reports_stale_profile_hash(monkeypatch):
    async def get_profile(uid): return PROFILE
    async def get_targets(uid): return {"targets": TARGETS, "profile_hash": "old", "preferences": {}}
    monkeypatch.setattr(ai_plan.firebase_service, "get_user_profile", get_profile)
    monkeypatch.setattr(ai_plan.firebase_service, "get_ai_targets", get_targets)
    result = await ai_plan.get_targets({"uid": "user-1"})
    assert result["targets"] == TARGETS
    assert result["stale"] is True


@pytest.mark.asyncio
async def test_failed_safe_plan_generation_returns_502(monkeypatch):
    preferences = AiPreferences()
    expected_hash = ai_plan.profile_hash(PROFILE, preferences)
    async def get_profile(uid): return PROFILE
    async def get_plan(uid, date_str): return None
    async def get_targets(uid): return {"targets": TARGETS, "profile_hash": expected_hash, "preferences": {}}
    async def claim(*args): return None
    async def unsafe(*args): raise ai_plan.AiGenerationError("Couldn't generate a safe result right now. Please try again.")
    monkeypatch.setattr(ai_plan.firebase_service, "get_user_profile", get_profile)
    monkeypatch.setattr(ai_plan.firebase_service, "get_ai_plan", get_plan)
    monkeypatch.setattr(ai_plan.firebase_service, "get_ai_targets", get_targets)
    monkeypatch.setattr(ai_plan.firebase_service, "claim_ai_generations", claim)
    monkeypatch.setattr(ai_plan.ai_nutrition_service, "generate_meal_plan", unsafe)
    request = GenerateMealPlanRequest(date=date(2026, 10, 27), preferences=preferences)
    with pytest.raises(HTTPException) as error:
        await ai_plan.generate_meal_plan(request, {"uid": "user-1"})
    assert error.value.status_code == 502
