from pydantic import BaseModel
from typing import Optional

class MealOut(BaseModel):
    id: int
    name: str
    calories: Optional[float]
    protein: Optional[float]
    carbs: Optional[float]
    fat: Optional[float]
    allergens: Optional[str]
    class Config:
        orm_mode = True
