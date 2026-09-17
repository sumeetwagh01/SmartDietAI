from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import ai, auth, food_log, meal_plan, nutrition, progress
from config.firebase_config import init_firebase
from config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()
    yield


app = FastAPI(title="SmartDietAI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(meal_plan.router, prefix="/api/v1")
app.include_router(food_log.router, prefix="/api/v1")
app.include_router(nutrition.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "SmartDietAI API v1.0.0"}
