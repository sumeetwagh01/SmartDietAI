from fastapi import FastAPI
from app.routers import auth, diet, allergen, analytics
from app.config import settings

app = FastAPI(title="SmartDietAI API", version="1.0.0")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(diet.router, prefix="/api/diet", tags=["diet"])
app.include_router(allergen.router, prefix="/api/allergen", tags=["allergen"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
def health_check():
    return {"status": "ok", "app": "SmartDietAI"}
