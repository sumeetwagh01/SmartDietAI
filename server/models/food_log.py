from datetime import date

from pydantic import BaseModel


class FoodEntry(BaseModel):
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fibre: float
    sodium: float


class FoodLogCreate(BaseModel):
    date: date
    meal_type: str
    entries: list[FoodEntry]


class FoodLogResponse(BaseModel):
    id: str
    uid: str
    date: date
    meal_type: str
    entries: list[FoodEntry]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fibre: float
    total_sodium: float
