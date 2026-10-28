import hashlib
import json
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from api.middleware.auth_middleware import get_current_user
from models.ai_plan import AiPreferences, GenerateMealPlanRequest, GenerateTargetsRequest
from services import ai_nutrition_service, firebase_service
from services.ai_nutrition_service import AiGenerationError


router = APIRouter(prefix="/ai-plan")
REQUIRED_PROFILE_FIELDS = ("age", "gender", "height_cm", "weight_kg", "activity_level", "goal")


def _profile_value(value):
    return getattr(value, "value", value)


def _require_complete(profile: dict | None) -> dict:
    missing = [
        field
        for field in REQUIRED_PROFILE_FIELDS
        if not profile or profile.get(field) in (None, "")
    ]
    if missing:
        labels = {
            "height_cm": "height",
            "weight_kg": "weight",
            "activity_level": "activity level",
        }
        readable = ", ".join(labels.get(field, field) for field in missing)
        raise HTTPException(
            status_code=422,
            detail=f"Complete your profile first. Missing: {readable}.",
        )
    return profile


def profile_hash(profile: dict, preferences: AiPreferences) -> str:
    payload = {
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "height_cm": profile.get("height_cm"),
        "weight_kg": profile.get("weight_kg"),
        "activity_level": _profile_value(profile.get("activity_level")),
        "goal": _profile_value(profile.get("goal")),
        "medical_conditions": sorted(_profile_value(value) for value in profile.get("medical_conditions", [])),
        "allergens": sorted(str(value) for value in profile.get("allergens", [])),
        "is_vegetarian": bool(profile.get("is_vegetarian")),
        "is_vegan": bool(profile.get("is_vegan")),
        "preferences": preferences.model_dump(mode="json"),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


async def _profile(uid: str) -> dict:
    return _require_complete(await firebase_service.get_user_profile(uid))


def _preferences(value: dict | None) -> AiPreferences:
    return AiPreferences.model_validate(value or {})


async def _claim(uid: str, count: int) -> None:
    try:
        await firebase_service.claim_ai_generations(uid, date.today().isoformat(), count)
    except firebase_service.AiUsageError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc


async def _release(uid: str, count: int) -> None:
    try:
        await firebase_service.release_ai_generations(uid, date.today().isoformat(), count)
    except Exception:
        # Releasing quota is best-effort and must not mask the generation error.
        pass


async def _generate_and_save_targets(uid: str, profile: dict, preferences: AiPreferences, hash_value: str) -> dict:
    try:
        targets = await ai_nutrition_service.generate_targets(profile, preferences)
    except AiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    await firebase_service.save_ai_targets(uid, {
        "targets": targets,
        "profile_hash": hash_value,
        "preferences": preferences.model_dump(mode="json"),
        "generated_at": datetime.now(UTC).isoformat(),
    })
    return targets


@router.get("/targets")
async def get_targets(user: dict = Depends(get_current_user)):
    profile = await _profile(user["uid"])
    cached = await firebase_service.get_ai_targets(user["uid"])
    if not cached or not cached.get("targets"):
        return {"targets": None, "stale": False}
    preferences = _preferences(cached.get("preferences"))
    return {
        "targets": cached["targets"],
        "stale": cached.get("profile_hash") != profile_hash(profile, preferences),
    }


@router.post("/targets")
async def generate_targets(body: GenerateTargetsRequest, user: dict = Depends(get_current_user)):
    profile = await _profile(user["uid"])
    hash_value = profile_hash(profile, body.preferences)
    cached = await firebase_service.get_ai_targets(user["uid"])
    if not body.force and cached and cached.get("profile_hash") == hash_value and cached.get("targets"):
        return cached["targets"]
    await _claim(user["uid"], 1)
    try:
        return await _generate_and_save_targets(user["uid"], profile, body.preferences, hash_value)
    except HTTPException:
        await _release(user["uid"], 1)
        raise


@router.get("/today")
async def get_today_plan(
    plan_date: date = Query(alias="date"),
    user: dict = Depends(get_current_user),
):
    return {"plan": await firebase_service.get_ai_plan(user["uid"], plan_date.isoformat())}


@router.post("/meal-plan")
async def generate_meal_plan(body: GenerateMealPlanRequest, user: dict = Depends(get_current_user)):
    profile = await _profile(user["uid"])
    date_str = body.date.isoformat()
    hash_value = profile_hash(profile, body.preferences)
    cached_plan = await firebase_service.get_ai_plan(user["uid"], date_str)
    if not body.regenerate and cached_plan and cached_plan.get("profile_hash") == hash_value:
        return cached_plan

    cached_targets = await firebase_service.get_ai_targets(user["uid"])
    valid_targets = cached_targets and cached_targets.get("profile_hash") == hash_value and cached_targets.get("targets")
    reserved = 1 if valid_targets else 2
    await _claim(user["uid"], reserved)
    generated_targets = False
    try:
        if valid_targets:
            targets = cached_targets["targets"]
        else:
            targets = await _generate_and_save_targets(user["uid"], profile, body.preferences, hash_value)
            generated_targets = True
        plan = await ai_nutrition_service.generate_meal_plan(profile, body.preferences, targets, date_str)
    except AiGenerationError as exc:
        await _release(user["uid"], 1 if generated_targets else reserved)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except HTTPException:
        await _release(user["uid"], reserved)
        raise
    stored = {**plan, "profile_hash": hash_value, "preferences": body.preferences.model_dump(mode="json")}
    await firebase_service.save_ai_plan(user["uid"], date_str, stored)
    return stored

