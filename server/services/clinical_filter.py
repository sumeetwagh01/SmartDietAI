import pandas as pd

from models.user import MedicalCondition, UserProfile


def _condition_values(profile: UserProfile) -> set[str]:
    return {
        condition.value if isinstance(condition, MedicalCondition) else str(condition).lower()
        for condition in profile.medical_conditions
    }


def _keep_missing_or_at_most(
    food_db: pd.DataFrame, column: str, maximum: float
) -> pd.DataFrame:
    return food_db[food_db[column].isna() | (food_db[column] <= maximum)]


def apply(food_db: pd.DataFrame, profile: UserProfile) -> pd.DataFrame:
    filtered = food_db.copy()

    if profile.is_vegan:
        filtered = filtered[filtered["is_vegan"] == True]  # noqa: E712
    if profile.is_vegetarian:
        filtered = filtered[filtered["is_vegetarian"] == True]  # noqa: E712

    allergen_values = filtered["allergens"].fillna("").astype(str)
    for allergen in profile.allergens:
        filtered = filtered[
            ~allergen_values.loc[filtered.index].str.contains(
                allergen, case=False, regex=False, na=False
            )
        ]

    conditions = _condition_values(profile)

    if "lactose_intolerance" in conditions:
        filtered = filtered[filtered["is_dairy"] != True]  # noqa: E712
    if "gluten_intolerance" in conditions:
        filtered = filtered[filtered["is_gluten"] != True]  # noqa: E712
    if "diabetes" in conditions:
        filtered = _keep_missing_or_at_most(filtered, "glycaemic_index", 70)
    if "hypertension" in conditions:
        filtered = _keep_missing_or_at_most(filtered, "sodium", 400)
    if "kidney_disease" in conditions:
        filtered = _keep_missing_or_at_most(filtered, "sodium", 300)
    if "heart_disease" in conditions:
        filtered = _keep_missing_or_at_most(filtered, "fat", 15)

    return filtered.reset_index(drop=True)
