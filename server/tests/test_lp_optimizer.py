from pathlib import Path

import pandas as pd

from models.user import ActivityLevel, DietGoal, MedicalCondition, UserProfile
from services.clinical_filter import apply
from services.lp_optimizer import optimize_meal_plan
from services.nutrition_calculator import compute_targets


FOOD_DB = pd.read_csv(Path(__file__).parents[1] / "data" / "food_db_final.csv")


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


def test_diabetic_vegetarian():
    user = profile(medical_conditions=[MedicalCondition.diabetes], is_vegetarian=True)
    safe_foods = apply(FOOD_DB, user)
    result = optimize_meal_plan(user, safe_foods)

    assert result.status in ("optimal", "feasible")
    assert result.total_calories > 0
    assert all(bool(food["is_vegetarian"]) for food in result.selected_foods)


def test_sequential_adjustment():
    targets = compute_targets(profile(), actual_yesterday_kcal=1200)
    assert targets.sequential_adjustment > 0


def test_hypertensive_sodium():
    safe_foods = apply(FOOD_DB, profile(medical_conditions=[MedicalCondition.hypertension]))
    assert (safe_foods["sodium"] <= 400).all()


def test_lactose_intolerant():
    safe_foods = apply(FOOD_DB, profile(medical_conditions=[MedicalCondition.lactose_intolerance]))
    assert not safe_foods["is_dairy"].astype(bool).any()


def test_vegan():
    safe_foods = apply(FOOD_DB, profile(is_vegan=True))
    assert safe_foods["is_vegan"].astype(bool).all()


def test_infeasible_fallback():
    result = optimize_meal_plan(profile(), FOOD_DB.head(2))
    assert result.status in ("feasible", "infeasible")
