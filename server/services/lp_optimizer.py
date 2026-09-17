from dataclasses import asdict, dataclass
from typing import Any

import pandas as pd
import pulp

from models.user import UserProfile
from services.nutrition_calculator import NutrientTargets, compute_targets


@dataclass
class MealPlanResult:
    status: str
    selected_foods: list[dict[str, Any]]
    total_calories: float
    totals: dict[str, float]
    calorie_target: float
    meals: dict[str, list[dict[str, Any]]]
    constraint_summary: dict[str, str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _number(row: pd.Series, column: str) -> float:
    value = pd.to_numeric(row.get(column, 0), errors="coerce")
    return 0.0 if pd.isna(value) else float(value)


def _meal_name(value: Any) -> str:
    value = str(value or "meal").strip().lower()
    return value if value in {"breakfast", "lunch", "dinner", "snacks"} else "meal"


def optimize_meal_plan(
    profile: UserProfile,
    food_db: pd.DataFrame,
    targets: NutrientTargets | None = None,
) -> MealPlanResult:
    """Choose food portions close to a user's daily calorie and macro targets.

    Portions are continuous multiples of each database serving. Binary variables limit
    the plan to a practical number of distinct foods. A deterministic fallback is
    returned when CBC cannot find a solution, so small/custom databases never crash.
    """
    targets = targets or compute_targets(profile)
    foods = food_db.reset_index(drop=True).copy()
    if foods.empty:
        return _fallback(foods, targets, "infeasible")

    problem = pulp.LpProblem("smartdiet_meal_plan", pulp.LpMinimize)
    portions = {
        i: pulp.LpVariable(f"portion_{i}", lowBound=0, upBound=3)
        for i in foods.index
    }
    chosen = {i: pulp.LpVariable(f"chosen_{i}", cat="Binary") for i in foods.index}
    for i in foods.index:
        problem += portions[i] <= 3 * chosen[i]
        problem += portions[i] >= 0.25 * chosen[i]

    max_foods = min(12, len(foods))
    min_foods = min(4, len(foods))
    problem += pulp.lpSum(chosen.values()) >= min_foods
    problem += pulp.lpSum(chosen.values()) <= max_foods

    nutrient_targets = {
        "calories": ("calories", targets.target_calories),
        "protein": ("protein", targets.protein_g),
        "carbs": ("carbs", targets.carbs_g),
        "fat": ("fat", targets.fat_g),
        "fibre": ("fibre", targets.fibre_g),
    }
    deviations = []
    for label, (column, target) in nutrient_targets.items():
        under = pulp.LpVariable(f"{label}_under", lowBound=0)
        over = pulp.LpVariable(f"{label}_over", lowBound=0)
        total = pulp.lpSum(_number(foods.loc[i], column) * portions[i] for i in foods.index)
        problem += total + under - over == target
        weight = 4.0 if label == "calories" else 1.0
        deviations.append(weight * (under + over) / max(target, 1.0))

    problem += pulp.lpSum(deviations) + 0.005 * pulp.lpSum(chosen.values())

    try:
        problem.solve(pulp.PULP_CBC_CMD(msg=False, timeLimit=20))
    except (pulp.PulpError, OSError):
        return _fallback(foods, targets, "feasible" if len(foods) else "infeasible")

    if pulp.LpStatus[problem.status] not in {"Optimal", "Feasible"}:
        return _fallback(foods, targets, "infeasible")

    selected = []
    meals: dict[str, list[dict[str, Any]]] = {}
    totals = {name: 0.0 for name in nutrient_targets}
    for i, variable in portions.items():
        quantity = float(variable.value() or 0)
        if quantity < 0.01:
            continue
        row = foods.loc[i]
        item = row.to_dict()
        item["quantity"] = round(quantity, 2)
        item["unit"] = str(item.get("unit", "serving"))
        for name, (column, _) in nutrient_targets.items():
            amount = _number(row, column) * quantity
            totals[name] += amount
            item[name] = round(amount, 2)
        selected.append(item)
        meals.setdefault(_meal_name(row.get("meal_type")), []).append(item)

    totals = {key: round(value, 2) for key, value in totals.items()}
    status = "optimal" if pulp.LpStatus[problem.status] == "Optimal" and len(foods) >= 4 else "feasible"
    return MealPlanResult(
        status=status,
        selected_foods=selected,
        total_calories=totals["calories"],
        totals=totals,
        calorie_target=round(targets.target_calories, 2),
        meals=meals,
        constraint_summary={
            "diet": "vegan" if profile.is_vegan else "vegetarian" if profile.is_vegetarian else "omnivore",
            "calories": f"Target {targets.target_calories:.0f} kcal",
        },
    )


def _fallback(foods: pd.DataFrame, targets: NutrientTargets, status: str) -> MealPlanResult:
    selected = []
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fibre": 0.0}
    if not foods.empty:
        for _, row in foods.head(min(4, len(foods))).iterrows():
            item = row.to_dict()
            item.update({"quantity": 1.0, "unit": str(item.get("unit", "serving"))})
            for nutrient in totals:
                totals[nutrient] += _number(row, nutrient)
            selected.append(item)
    totals = {key: round(value, 2) for key, value in totals.items()}
    meals: dict[str, list[dict[str, Any]]] = {}
    for item in selected:
        meals.setdefault(_meal_name(item.get("meal_type")), []).append(item)
    return MealPlanResult(status, selected, totals["calories"], totals, round(targets.target_calories, 2), meals, {"fallback": "Used available foods"})
