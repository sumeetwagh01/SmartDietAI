import re
from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CuisineRegion(str, Enum):
    north_indian = "north_indian"
    south_indian = "south_indian"
    gujarati = "gujarati"
    maharashtrian = "maharashtrian"
    bengali = "bengali"
    punjabi = "punjabi"
    rajasthani = "rajasthani"
    east_indian = "east_indian"
    other = "other"


class AiPreferences(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cuisine_regions: list[CuisineRegion] = Field(default_factory=list, max_length=4)
    meals_per_day: int = Field(default=4)
    spice_level: str = Field(default="medium", pattern=r"^(mild|medium|hot)$")
    cooking_time: str = Field(default="any", pattern=r"^(quick|normal|any)$")
    budget: str = Field(default="any", pattern=r"^(low|medium|any)$")
    disliked_foods: list[str] = Field(default_factory=list, max_length=10)
    target_weight_kg: float | None = Field(default=None, ge=25, le=250)
    fasting: str = Field(default="none", pattern=r"^(none|12:12|14:10|16:8)$")

    @field_validator("meals_per_day")
    @classmethod
    def validate_meals_per_day(cls, value: int) -> int:
        if value not in {3, 4, 5}:
            raise ValueError("meals_per_day must be 3, 4, or 5")
        return value

    @field_validator("disliked_foods", mode="before")
    @classmethod
    def clean_disliked_foods(cls, values) -> list[str]:
        cleaned = []
        for value in values or []:
            item = re.sub(r"[^A-Za-z0-9 -]", "", str(value)).strip()[:40]
            if item and item.lower() not in {entry.lower() for entry in cleaned}:
                cleaned.append(item)
        return cleaned[:10]


class TargetCalculation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    bmr_kcal: int
    tdee_kcal: int
    goal_adjustment_kcal: int
    method: str = Field(min_length=1, max_length=120)


class AiTargets(BaseModel):
    model_config = ConfigDict(extra="forbid")

    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    fibre_g: int
    water_ml: int
    calculation: TargetCalculation
    rationale: str = Field(max_length=280)
    cautions: list[str] = Field(default_factory=list, max_length=3)


class AiMealItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    quantity: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=40)
    grams: float | None = Field(default=None, ge=0)
    calories: float = Field(ge=0, le=1500)
    protein_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)
    fibre_g: float = Field(ge=0)
    sodium_mg: float = Field(ge=0)
    ingredients: list[str] = Field(min_length=1)
    prep_note: str = Field(default="", max_length=140)


class AiMeals(BaseModel):
    model_config = ConfigDict(extra="forbid")

    breakfast: list[AiMealItem]
    lunch: list[AiMealItem]
    snacks: list[AiMealItem]
    dinner: list[AiMealItem]


class WhyThisPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    calories: str
    protein: str
    conditions: str
    preferences: str


class GeminiMealPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    meals: AiMeals
    why_this_plan: WhyThisPlan
    tips: list[str] = Field(default_factory=list, max_length=4)
    cautions: list[str] = Field(default_factory=list, max_length=3)


class GenerateTargetsRequest(BaseModel):
    preferences: AiPreferences = Field(default_factory=AiPreferences)
    force: bool = False


class GenerateMealPlanRequest(BaseModel):
    date: date
    preferences: AiPreferences = Field(default_factory=AiPreferences)
    regenerate: bool = False

