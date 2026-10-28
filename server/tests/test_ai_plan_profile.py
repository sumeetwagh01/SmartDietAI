import os

import pytest
from fastapi import HTTPException


os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from api.routes.ai_plan import _require_complete


def test_incomplete_profile_lists_missing_fields():
    profile = {
        "age": 25,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 70,
        "goal": "maintenance",
    }

    with pytest.raises(HTTPException) as caught:
        _require_complete(profile)

    assert caught.value.status_code == 422
    assert caught.value.detail == "Complete your profile first. Missing: activity level."


def test_complete_profile_is_returned_unchanged():
    profile = {
        "age": 25,
        "gender": "male",
        "height_cm": 175,
        "weight_kg": 70,
        "activity_level": "moderate",
        "goal": "maintenance",
    }

    assert _require_complete(profile) is profile
