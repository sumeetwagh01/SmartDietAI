from fastapi import APIRouter
from app.services.allergen_svc import detect_allergens

router = APIRouter()

@router.post("/detect")
def detect(food_item: dict):
    result = detect_allergens(food_item.get("name", ""))
    return {"food": food_item.get("name"), "allergens_detected": result}
