import os
from datetime import date

import pytest

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from api.routes import food_log
from models.food_log import FoodEntry, FoodLogCreate


USER = {"uid": "user-1"}


def entry(name, calories, protein, carbs, fat, sodium):
    return FoodEntry(
        food_name=name,
        quantity=1,
        unit="serving",
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        fibre=5,
        sodium=sodium,
    )


@pytest.mark.asyncio
async def test_post_saves_daily_document_and_returns_totals(monkeypatch):
    saved = {}

    async def save(uid, date_str, log):
        saved.update(uid=uid, date_str=date_str, log=log)

    monkeypatch.setattr(food_log.firebase_service, "save_food_log", save)
    body = FoodLogCreate(
        date=date(2026, 9, 18),
        meal_type="mixed",
        entries=[
            entry("Poha", 250, 7, 45, 5, 300),
            entry("Dal", 350, 18, 50, 9, 450),
        ],
    )

    result = await food_log.create_food_log(body, USER)

    assert result == {
        "total_calories": 600,
        "total_protein": 25,
        "total_carbs": 95,
        "total_fat": 14,
        "total_sodium": 750,
    }
    assert saved["uid"] == "user-1"
    assert saved["date_str"] == "2026-09-18"
    assert saved["log"]["id"] == "user-1_2026-09-18"
    assert saved["log"]["date"] == "2026-09-18"
    assert len(saved["log"]["entries"]) == 2
    assert saved["log"]["total_calories"] == 600


@pytest.mark.asyncio
async def test_get_returns_saved_document(monkeypatch):
    stored = {"entries": [{"food_name": "Poha"}], "total_calories": 250}

    async def get(uid, date_str):
        assert (uid, date_str) == ("user-1", "2026-09-18")
        return stored

    monkeypatch.setattr(food_log.firebase_service, "get_food_log", get)

    assert await food_log.get_food_log("2026-09-18", USER) is stored


@pytest.mark.asyncio
async def test_get_returns_empty_response_for_missing_document(monkeypatch):
    async def get(uid, date_str):
        return None

    monkeypatch.setattr(food_log.firebase_service, "get_food_log", get)

    assert await food_log.get_food_log("2026-09-18", USER) == {
        "entries": [],
        "total_calories": 0,
        "total_protein": 0,
        "total_carbs": 0,
        "total_fat": 0,
        "total_sodium": 0,
    }
