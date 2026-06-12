from fastapi import APIRouter, Depends
from app.services.recommender_svc import get_recommendations

router = APIRouter()

@router.get("/recommend/{user_id}")
def recommend_meals(user_id: int):
    recommendations = get_recommendations(user_id)
    return {"user_id": user_id, "recommendations": recommendations}
