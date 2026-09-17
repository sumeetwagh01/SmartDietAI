import json
import os
from types import SimpleNamespace

import pytest

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from services import gemini_service


LP_RESULT = {
    "meals": {"breakfast": [{"food_name": "Poha"}]},
    "totals": {"calories": 1800, "protein": 100},
    "targets": {"target_calories": 1900, "protein_g": 110},
    "constraint_summary": {"diet": "vegetarian"},
}
PROFILE = {
    "age": 30,
    "gender": "male",
    "weight_kg": 70,
    "goal": "maintenance",
    "medical_conditions": ["diabetes"],
    "allergens": ["peanut"],
    "is_vegetarian": True,
    "is_vegan": False,
}


def explanation(condition_reason="The plan respects diabetes constraints."):
    return {
        "calorie_reason": "Calories are close to target.",
        "protein_reason": "Protein supports the goal.",
        "condition_reason": condition_reason,
        "excluded_foods": "Unsafe foods were excluded.",
        "practical_tip": "Follow the listed portions.",
    }


def install_model(monkeypatch, responses):
    prompts = []

    class FakeModel:
        def __init__(self, model_name, system_instruction):
            assert model_name == "gemini-3.6-flash"
            assert "NEVER recommend different foods" in system_instruction

        def generate_content(self, prompt):
            prompts.append(prompt)
            response = responses[len(prompts) - 1]
            if isinstance(response, Exception):
                raise response
            return SimpleNamespace(text=response)

    monkeypatch.setattr(gemini_service.genai, "configure", lambda **kwargs: None)
    monkeypatch.setattr(gemini_service.genai, "GenerativeModel", FakeModel)
    return prompts


def test_generate_explanation_accepts_json_markdown_fence(monkeypatch):
    expected = explanation()
    prompts = install_model(monkeypatch, [f"```json\n{json.dumps(expected)}\n```"])

    result = gemini_service.generate_explanation(LP_RESULT, PROFILE)

    assert result == expected
    assert len(prompts) == 1
    assert '"targets": {"target_calories": 1900' in prompts[0]
    assert '"diet_type": "vegetarian"' in prompts[0]


def test_unfaithful_condition_is_retried_once(monkeypatch):
    prompts = install_model(
        monkeypatch,
        [
            json.dumps(explanation("Suitable for hypertension.")),
            json.dumps(explanation()),
        ],
    )

    result = gemini_service.generate_explanation(LP_RESULT, PROFILE)

    assert result == explanation()
    assert len(prompts) == 2
    assert "Unsupported medical conditions cited: hypertension" in prompts[1]


@pytest.mark.parametrize(
    "response", ["not json", "[]", RuntimeError("API unavailable")]
)
def test_two_failed_calls_return_factual_fallback(monkeypatch, response):
    prompts = install_model(monkeypatch, [response, response])

    result = gemini_service.generate_explanation(LP_RESULT, PROFILE)

    assert len(prompts) == 2
    assert "1800 kcal" in result["calorie_reason"]
    assert "1900 kcal" in result["calorie_reason"]
    assert "100 g" in result["protein_reason"]
    assert "110 g" in result["protein_reason"]
