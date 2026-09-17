import asyncio
import json
from datetime import date, timedelta

import google.generativeai as genai
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api.middleware.auth_middleware import get_current_user
from config.settings import settings
from services import firebase_service, gemini_service


router = APIRouter(prefix="/ai")


class ChatRequest(BaseModel):
    message: str
    history: list


def _model():
    if hasattr(gemini_service, "model"):
        return gemini_service.model
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(gemini_service.MODEL_NAME)


@router.post("/chat")
async def chat(
    body: ChatRequest,
    user: dict = Depends(get_current_user),
):
    today_log = await firebase_service.get_food_log(
        user["uid"], date.today().isoformat()
    )
    system_prompt = (
        "You are a practical nutrition assistant. Use only this user profile and "
        "today's food-log summary when personalizing your answer. "
        f"User profile: {user}. Today's food log: {today_log or {}}."
    )
    prompt = (
        f"{system_prompt}\n"
        f"Conversation history: {json.dumps(body.history, default=str)}\n"
        f"User question: {body.message}\n"
        "Give a concise, practical answer. Do not diagnose disease or replace medical care."
    )
    response = await asyncio.to_thread(_model().generate_content, prompt)
    return {"reply": response.text}


@router.get("/suggestions")
async def suggestions(user: dict = Depends(get_current_user)):
    days = [date.today() - timedelta(days=offset) for offset in range(3)]
    logs = await asyncio.gather(
        *(
            firebase_service.get_food_log(user["uid"], day.isoformat())
            for day in days
        )
    )
    prompt = (
        "Give exactly one short, practical diet tip based on this user profile "
        f"and recent three-day food log. Profile: {user}. Logs: {logs}."
    )
    response = await asyncio.to_thread(_model().generate_content, prompt)
    return {"tip": response.text}
