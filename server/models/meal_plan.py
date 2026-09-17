from pydantic import BaseModel


class MealItem(BaseModel):
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    sodium: float


class MealPlanRequest(BaseModel):
    days: int = 1


class MealPlanResponse(BaseModel):
    status: str
    targets: dict[str, float]
    meals: dict[str, list[MealItem]]
    totals: dict[str, float]
    explanation: str
    constraint_summary: dict[str, str]
