from dataclasses import dataclass
from typing import Optional

from models.user import UserProfile


@dataclass
class NutrientTargets:
    bmr: float
    tdee: float
    target_calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fibre_g: float
    sequential_adjustment: float


ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

GOAL_ADJUSTMENTS = {
    "weight_loss": -500,
    "weight_gain": 400,
    "maintenance": 0,
    "muscle_gain": 200,
}

MACRO_RATIOS = {
    "weight_loss": (0.35, 0.40, 0.25),
    "weight_gain": (0.30, 0.50, 0.20),
    "maintenance": (0.25, 0.50, 0.25),
    "muscle_gain": (0.40, 0.40, 0.20),
}


def compute_targets(
    profile: UserProfile, actual_yesterday_kcal: Optional[float] = None
) -> NutrientTargets:
    gender = profile.gender.lower()
    bmr_offset = 5 if gender == "male" else -161
    bmr = (
        10 * profile.weight_kg
        + 6.25 * profile.height_cm
        - 5 * profile.age
        + bmr_offset
    )

    activity_level = profile.activity_level.value
    tdee = bmr * ACTIVITY_MULTIPLIERS[activity_level]

    sequential_adjustment = 0.0
    if actual_yesterday_kcal is not None:
        adjustment = (tdee - actual_yesterday_kcal) * 0.30
        sequential_adjustment = min(300.0, max(-300.0, adjustment))

    goal = profile.goal.value
    calorie_floor = 1500.0 if gender == "male" else 1200.0
    target_calories = max(
        tdee + GOAL_ADJUSTMENTS[goal] + sequential_adjustment,
        calorie_floor,
    )

    protein_pct, carb_pct, fat_pct = MACRO_RATIOS[goal]
    protein_g = max(
        (target_calories * protein_pct) / 4,
        profile.weight_kg * 0.8,
    )
    carbs_g = (target_calories * carb_pct) / 4
    fat_g = (target_calories * fat_pct) / 9
    fibre_g = (target_calories / 1000) * 14

    return NutrientTargets(
        bmr=bmr,
        tdee=tdee,
        target_calories=target_calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        fibre_g=fibre_g,
        sequential_adjustment=sequential_adjustment,
    )
