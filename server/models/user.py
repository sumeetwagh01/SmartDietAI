from enum import Enum

from pydantic import BaseModel


class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    light = "light"
    moderate = "moderate"
    active = "active"
    very_active = "very_active"


class DietGoal(str, Enum):
    weight_loss = "weight_loss"
    weight_gain = "weight_gain"
    maintenance = "maintenance"
    muscle_gain = "muscle_gain"


class MedicalCondition(str, Enum):
    diabetes = "diabetes"
    hypertension = "hypertension"
    lactose_intolerance = "lactose_intolerance"
    gluten_intolerance = "gluten_intolerance"
    kidney_disease = "kidney_disease"
    heart_disease = "heart_disease"
    pcos = "pcos"
    hypothyroid = "hypothyroid"


class UserProfile(BaseModel):
    uid: str
    name: str
    email: str
    age: int
    gender: str
    weight_kg: float
    height_cm: float
    activity_level: ActivityLevel
    goal: DietGoal
    medical_conditions: list[MedicalCondition] = []
    allergens: list[str] = []
    is_vegetarian: bool = False
    is_vegan: bool = False


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    activity_level: ActivityLevel | None = None
    goal: DietGoal | None = None
    medical_conditions: list[MedicalCondition] | None = None
    allergens: list[str] | None = None
    is_vegetarian: bool | None = None
    is_vegan: bool | None = None
