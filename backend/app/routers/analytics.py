from fastapi import APIRouter
from app.services.nutrient_svc import get_nutrient_score

router = APIRouter()

@router.get("/nutrients/{meal_id}")
def nutrient_analysis(meal_id: int):
    score = get_nutrient_score(meal_id)
    return {"meal_id": meal_id, "nutrient_score": score}
