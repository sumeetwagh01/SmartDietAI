import re
from typing import Iterable


KEYWORDS = {
    "dairy": ["milk", "paneer", "curd", "dahi", "yogurt", "ghee", "butter", "buttermilk", "chaas", "cheese", "cream", "lassi", "kheer", "raita", "khoa", "mawa", "rabri"],
    "gluten": ["wheat", "atta", "maida", "roti", "chapati", "phulka", "naan", "paratha", "puri", "bhatura", "bread", "pav", "pasta", "noodles", "semolina", "suji", "rava", "dalia", "barley", "seitan"],
    "nuts": ["almond", "cashew", "peanut", "groundnut", "walnut", "pistachio", "hazelnut", "pecan", "badam", "kaju", "pista", "akhrot"],
    "eggs": ["egg", "omelette", "anda", "mayonnaise"],
    "fish": ["fish", "prawn", "shrimp", "crab", "tuna", "salmon", "rohu", "hilsa", "pomfret", "surmai", "sardine", "anchovy", "seafood"],
    "legumes": ["dal", "lentil", "chana", "chickpea", "rajma", "moong", "masoor", "urad", "toor", "soy", "soya", "tofu", "peas", "beans", "besan", "hummus", "peanut"],
    "meat": ["chicken", "mutton", "lamb", "goat", "beef", "pork", "keema", "kebab", "sausage", "bacon", "ham"],
    "vegan_extra": ["honey", "gelatin"],
}


def _values(items: Iterable) -> set[str]:
    return {str(getattr(item, "value", item)).lower() for item in items or []}


def _contains(text: str, keyword: str) -> bool:
    escaped = re.escape(keyword.lower()).replace(r"\ ", r"\s+")
    return re.search(rf"(?<![a-z0-9]){escaped}(?:s|es)?(?![a-z0-9])", text.lower()) is not None


def validate_targets(targets: dict, profile: dict) -> list[str]:
    errors = []
    calories = float(targets.get("calories", 0))
    weight = float(profile.get("weight_kg") or 0)
    gender = str(profile.get("gender", "")).lower()
    minimum = 1200 if gender == "female" else 1500
    if not minimum <= calories <= 4500:
        errors.append(f"Calories must be between {minimum} and 4500")
    if not weight or not 18 <= calories / weight <= 50:
        errors.append("Calories per kg must be between 18 and 50")

    calculation = targets.get("calculation") or {}
    if abs(calories - (float(calculation.get("tdee_kcal", 0)) + float(calculation.get("goal_adjustment_kcal", 0)))) > 100:
        errors.append("Calories must equal TDEE plus goal adjustment within 100 kcal")

    protein = float(targets.get("protein_g", 0))
    carbs = float(targets.get("carbs_g", 0))
    fat = float(targets.get("fat_g", 0))
    macro_energy = 4 * protein + 4 * carbs + 9 * fat
    if not calories or abs(macro_energy - calories) / calories > 0.08:
        errors.append("Macro energy must be within 8% of calories")

    conditions = _values(profile.get("medical_conditions", []))
    protein_per_kg = protein / weight if weight else 0
    protein_bounds = (0.6, 0.9) if "kidney_disease" in conditions else (0.8, 2.5 if str(profile.get("goal")) == "muscle_gain" else 2.2)
    if not protein_bounds[0] <= protein_per_kg <= protein_bounds[1]:
        errors.append(f"Protein per kg must be between {protein_bounds[0]} and {protein_bounds[1]}")
    if not calories or not 0.15 <= (9 * fat) / calories <= 0.40:
        errors.append("Fat must provide 15% to 40% of energy")
    carb_share = (4 * carbs) / calories if calories else 0
    if carb_share < 0.20:
        errors.append("Carbohydrates must provide at least 20% of energy")
    if conditions.intersection({"diabetes", "pcos"}) and carb_share > 0.50:
        errors.append("Carbohydrates must not exceed 50% of energy for diabetes or PCOS")
    if not 20 <= float(targets.get("fibre_g", 0)) <= 50:
        errors.append("Fibre must be between 20 g and 50 g")
    if not 1500 <= float(targets.get("water_ml", 0)) <= 4500:
        errors.append("Water must be between 1500 ml and 4500 ml")
    return errors


def enforced_rules(profile: dict) -> list[str]:
    rules = []
    if profile.get("is_vegan"):
        rules.append("Vegan")
    elif profile.get("is_vegetarian"):
        rules.append("Vegetarian")
    for allergen in sorted(_values(profile.get("allergens", []))):
        rules.append(f"No {allergen.replace('_', ' ')}")
    conditions = _values(profile.get("medical_conditions", []))
    if "lactose_intolerance" in conditions and "No dairy" not in rules:
        rules.append("No dairy")
    if "gluten_intolerance" in conditions and "No gluten" not in rules:
        rules.append("No gluten")
    if conditions.intersection({"hypertension", "heart_disease", "kidney_disease"}):
        rules.append("Low sodium")
    if conditions.intersection({"diabetes", "pcos"}):
        rules.append("Lower glycaemic carbohydrates")
    return rules


def _blocked_groups(profile: dict) -> dict[str, list[str]]:
    groups = {}
    allergens = _values(profile.get("allergens", []))
    for allergen in allergens:
        groups[f"allergen {allergen}"] = KEYWORDS.get(allergen, [allergen])
    conditions = _values(profile.get("medical_conditions", []))
    if "lactose_intolerance" in conditions:
        groups["lactose intolerance"] = KEYWORDS["dairy"]
    if "gluten_intolerance" in conditions:
        groups["gluten intolerance"] = KEYWORDS["gluten"]
    if profile.get("is_vegetarian") or profile.get("is_vegan"):
        groups["vegetarian diet"] = KEYWORDS["meat"] + KEYWORDS["fish"] + KEYWORDS["eggs"]
    if profile.get("is_vegan"):
        groups["vegan diet"] = KEYWORDS["dairy"] + KEYWORDS["vegan_extra"]
    disliked = profile.get("preferences", {}).get("disliked_foods", [])
    for item in disliked:
        groups[f"disliked food {item}"] = [str(item)]
    return groups


def calculate_totals(meals: dict) -> dict[str, float]:
    totals = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0, "fibre_g": 0.0, "sodium_mg": 0.0}
    for items in (meals or {}).values():
        for item in items or []:
            for key in totals:
                totals[key] += float(item.get(key, 0) or 0)
    return {key: round(value, 2) for key, value in totals.items()}


def _dish_key(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", str(value).lower()))


def _matches_recent_dish(current: str, recent: str) -> bool:
    current_key = _dish_key(current)
    recent_key = _dish_key(recent)
    if not current_key or not recent_key:
        return False
    if current_key == recent_key:
        return True
    shorter, longer = sorted((current_key, recent_key), key=len)
    return len(shorter.split()) >= 2 and shorter in longer


def validate_plan(
    plan: dict,
    profile: dict,
    targets: dict,
    recent_dishes: Iterable[str] | None = None,
) -> list[str]:
    errors = []
    meals = plan.get("meals") or {}
    required_slots = {"breakfast", "lunch", "snacks", "dinner"}
    missing = sorted(required_slots - set(meals))
    if missing:
        errors.append("Missing meal slots: " + ", ".join(missing))
    meals_per_day = int(profile.get("preferences", {}).get("meals_per_day", 4) or 4)
    for slot in required_slots:
        items = meals.get(slot, [])
        if not items and not (slot == "snacks" and meals_per_day == 3):
            errors.append(f"{slot} must contain at least one item")

    names = []
    blocked = _blocked_groups(profile)
    for slot, items in meals.items():
        for item in items or []:
            name = str(item.get("name", "")).strip()
            names.append(name.lower())
            if not item.get("ingredients"):
                errors.append(f"{name or slot} must list at least one ingredient")
            for key in ("quantity", "calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "sodium_mg"):
                try:
                    number = float(item.get(key, -1))
                except (TypeError, ValueError):
                    number = -1
                if number < 0 or (key == "calories" and number > 1500):
                    errors.append(f"{name or slot} has invalid {key}")
            scan_text = " ".join([name, *(str(value) for value in item.get("ingredients", []))])
            for rule, keywords in blocked.items():
                hit = next((word for word in keywords if _contains(scan_text, word)), None)
                if hit:
                    errors.append(f"{name or slot} violates {rule}: found {hit}")
    duplicates = sorted({name for name in names if name and names.count(name) > 1})
    if duplicates:
        errors.append("Duplicate dishes: " + ", ".join(duplicates))
    repeated = sorted({
        name
        for name in names
        if any(_matches_recent_dish(name, recent) for recent in recent_dishes or [])
    })
    if repeated:
        errors.append("Plan repeats recent dishes: " + ", ".join(repeated))

    totals = calculate_totals(meals)
    target_calories = float(targets.get("calories", 0) or 0)
    if not target_calories or abs(totals["calories"] - target_calories) / target_calories > 0.10:
        errors.append("Plan calories must be within 10% of target")
    conditions = _values(profile.get("medical_conditions", []))
    if conditions.intersection({"hypertension", "heart_disease", "kidney_disease"}) and totals["sodium_mg"] > 2000:
        errors.append("Daily sodium must not exceed 2000 mg")
    return errors

