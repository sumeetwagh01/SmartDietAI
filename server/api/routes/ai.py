import asyncio
import json
from datetime import date, timedelta

from google import genai
from google.genai import types
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.middleware.auth_middleware import get_current_user
from config.settings import settings
from services import firebase_service


router = APIRouter(prefix="/ai")


class ChatRequest(BaseModel):
    message: str
    history: list


def _generate_text(prompt: str, system_instruction: str) -> str:
    with genai.Client(api_key=settings.GEMINI_API_KEY) as client:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini returned an empty response")
        return response.text


async def _safe_generate(prompt: str, system_instruction: str) -> str:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_generate_text, prompt, system_instruction),
            timeout=60,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="NutriBites is unavailable right now. Please try again.",
        ) from exc


def _profile_context(user: dict) -> dict:
    fields = (
        "age", "gender", "height_cm", "weight_kg", "activity_level", "goal",
        "medical_conditions", "allergens", "is_vegetarian", "is_vegan",
    )
    return {field: user.get(field) for field in fields}


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
        f"User profile: {_profile_context(user)}. Today's food log: {today_log or {}}."
    )
    prompt = (
        f"Conversation history: {json.dumps(body.history, default=str)}\n"
        f"User question: {body.message}\n"
        "Give a concise, practical answer. Do not diagnose disease or replace medical care."
    )
    return {"reply": await _safe_generate(prompt, system_prompt)}


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
        f"and recent three-day food log. Profile: {_profile_context(user)}. Logs: {logs}."
    )
    system_prompt = (
        "You are a practical nutrition assistant, not a doctor. Give one concise, "
        "safe suggestion and never diagnose or replace professional medical care."
    )
    return {"tip": await _safe_generate(prompt, system_prompt)}
