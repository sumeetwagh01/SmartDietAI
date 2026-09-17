import json
import re
from typing import Any

import google.generativeai as genai

from config.settings import settings


MODEL_NAME = "gemini-3.6-flash"

SYSTEM_INSTRUCTION = (
    "You are a nutrition advisor explaining a pre-computed meal plan. "
    "NEVER recommend different foods. "
    "ONLY explain WHY these specific foods suit this user. "
    "Respond ONLY in valid JSON, no markdown."
)

RESPONSE_STRUCTURE = {
    "calorie_reason": "...",
    "protein_reason": "...",
    "condition_reason": "...",
    "excluded_foods": "...",
    "practical_tip": "...",
}

KNOWN_CONDITIONS = {
    "diabetes",
    "hypertension",
    "lactose intolerance",
    "gluten intolerance",
    "kidney disease",
    "heart disease",
    "pcos",
    "hypothyroid",
}

def _normalise_values(values: list[Any]) -> set[str]:
    return {
        str(getattr(value, "value", value)).lower().replace("_", " ")
        for value in values
    }


def _faithfulness_check(explanation: dict, user_profile: dict) -> list[str]:
    checked_text = " ".join(
        str(explanation.get(field, ""))
        for field in ("condition_reason", "excluded_foods")
    ).lower()
    conditions = _normalise_values(user_profile.get("medical_conditions", []))
    errors = []

    unsupported_conditions = sorted(
        condition
        for condition in KNOWN_CONDITIONS
        if condition in checked_text and condition not in conditions
    )
    if unsupported_conditions:
        errors.append(
            "Unsupported medical conditions cited: "
            + ", ".join(unsupported_conditions)
        )

    return errors


def _strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _build_prompt(lp_result: dict, user_profile: dict) -> str:
    diet_type = (
        "vegan"
        if user_profile.get("is_vegan")
        else "vegetarian"
        if user_profile.get("is_vegetarian")
        else "omnivore"
    )
    context = {
        "user": {
            "age": user_profile.get("age"),
            "gender": user_profile.get("gender"),
            "weight": user_profile.get("weight_kg"),
            "goal": user_profile.get("goal"),
            "medical_conditions": user_profile.get("medical_conditions", []),
            "allergens": user_profile.get("allergens", []),
            "diet_type": diet_type,
        },
        "meals": lp_result.get("meals", {}),
        "totals": lp_result.get("totals", {}),
        "targets": lp_result.get("targets", {}),
        "constraint_summary": lp_result.get("constraint_summary", {}),
    }
    return (
        "Explain the supplied pre-computed meal plan using only the facts below. "
        f"Context: {json.dumps(context, default=str)}\n"
        "Return exactly this JSON structure: "
        f"{json.dumps(RESPONSE_STRUCTURE)}"
    )


def _fallback(lp_result: dict) -> dict:
    totals = lp_result.get("totals", {})
    targets = lp_result.get("targets", {})
    calories = totals.get("calories", totals.get("total_calories", 0))
    protein = totals.get("protein", totals.get("protein_g", 0))
    calorie_target = targets.get(
        "target_calories", lp_result.get("calorie_target", 0)
    )
    protein_target = targets.get("protein_g")
    protein_text = f" against a target of {protein_target} g" if protein_target is not None else ""
    return {
        "calorie_reason": f"The plan provides {calories} kcal against a target of {calorie_target} kcal.",
        "protein_reason": f"The plan provides {protein} g of protein{protein_text}.",
        "condition_reason": "The plan was filtered using the profile's recorded dietary constraints.",
        "excluded_foods": "Foods excluded by the recorded constraints are not included in this plan.",
        "practical_tip": "Follow the listed portions to stay close to the calculated totals.",
    }


def generate_explanation(lp_result: dict, user_profile: dict) -> dict:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            MODEL_NAME,
            system_instruction=SYSTEM_INSTRUCTION,
        )
    except Exception:
        return _fallback(lp_result)
    prompt = _build_prompt(lp_result, user_profile)

    for attempt in range(2):
        try:
            response = model.generate_content(prompt)
            explanation = json.loads(_strip_markdown_fences(response.text))
            if not isinstance(explanation, dict):
                explanation = {}
        except Exception:
            explanation = {}

        errors = _faithfulness_check(explanation, user_profile)
        missing_keys = sorted(set(RESPONSE_STRUCTURE) - set(explanation))
        if missing_keys:
            errors.append("Missing JSON fields: " + ", ".join(missing_keys))
        if not errors:
            return explanation
        if attempt == 0:
            prompt += "\nCorrect these faithfulness errors and return the JSON again: " + "; ".join(errors)

    return _fallback(lp_result)
