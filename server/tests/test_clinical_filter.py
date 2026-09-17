import math

import pandas as pd
import pytest

from models.user import ActivityLevel, DietGoal, MedicalCondition, UserProfile
from services.clinical_filter import apply


def profile(**overrides) -> UserProfile:
    values = {
        "uid": "test-user",
        "name": "Test User",
        "email": "test@example.com",
        "age": 30,
        "gender": "male",
        "weight_kg": 70,
        "height_cm": 175,
        "activity_level": ActivityLevel.moderate,
        "goal": DietGoal.maintenance,
    }
    values.update(overrides)
    return UserProfile(**values)


@pytest.fixture
def foods() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "food_name": "safe",
                "is_vegan": True,
                "is_vegetarian": True,
                "allergens": "",
                "is_dairy": False,
                "is_gluten": False,
                "glycaemic_index": 40,
                "sodium": 100,
                "fat": 5,
            },
            {
                "food_name": "unknown values",
                "is_vegan": True,
                "is_vegetarian": True,
                "allergens": None,
                "is_dairy": False,
                "is_gluten": False,
                "glycaemic_index": math.nan,
                "sodium": math.nan,
                "fat": math.nan,
            },
            {
                "food_name": "unsafe",
                "is_vegan": False,
                "is_vegetarian": False,
                "allergens": "Peanut, Soy",
                "is_dairy": True,
                "is_gluten": True,
                "glycaemic_index": 71,
                "sodium": 401,
                "fat": 16,
            },
        ]
    )


def test_vegan_and_vegetarian_rules_are_both_applied(foods):
    result = apply(foods, profile(is_vegan=True, is_vegetarian=True))

    assert result["food_name"].tolist() == ["safe", "unknown values"]
    assert result.index.tolist() == [0, 1]


def test_allergen_match_is_case_insensitive(foods):
    result = apply(foods, profile(allergens=["PEANUT"]))

    assert "unsafe" not in result["food_name"].tolist()


@pytest.mark.parametrize(
    ("condition", "expected"),
    [
        (MedicalCondition.lactose_intolerance, ["safe", "unknown values"]),
        (MedicalCondition.gluten_intolerance, ["safe", "unknown values"]),
        (MedicalCondition.diabetes, ["safe", "unknown values"]),
        (MedicalCondition.hypertension, ["safe", "unknown values"]),
        (MedicalCondition.kidney_disease, ["safe", "unknown values"]),
        (MedicalCondition.heart_disease, ["safe", "unknown values"]),
    ],
)
def test_medical_condition_filters_keep_missing_nutrients(foods, condition, expected):
    result = apply(foods, profile(medical_conditions=[condition]))

    assert result["food_name"].tolist() == expected
