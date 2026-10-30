from services.ai_safety import validate_plan, validate_targets


BASE_PROFILE = {
    "age": 30,
    "gender": "female",
    "weight_kg": 60,
    "goal": "maintenance",
    "medical_conditions": [],
    "allergens": [],
    "is_vegetarian": False,
    "is_vegan": False,
    "preferences": {"meals_per_day": 4, "disliked_foods": []},
}
TARGETS = {
    "calories": 1800,
    "protein_g": 90,
    "carbs_g": 225,
    "fat_g": 60,
    "fibre_g": 30,
    "water_ml": 2200,
    "calculation": {"bmr_kcal": 1400, "tdee_kcal": 1800, "goal_adjustment_kcal": 0},
}


def item(name, ingredients, calories=450, sodium=200):
    return {"name": name, "quantity": 1, "unit": "katori", "calories": calories, "protein_g": 22.5, "carbs_g": 56.25, "fat_g": 15, "fibre_g": 7.5, "sodium_mg": sodium, "ingredients": ingredients}


def plan(*items):
    values = list(items) or [item("Poha", ["rice flakes"]), item("Rice Bowl", ["rice"]), item("Fruit Bowl", ["apple"]), item("Vegetable Khichdi", ["rice", "vegetables"])]
    return {"meals": {"breakfast": [values[0]], "lunch": [values[1]], "snacks": [values[2]], "dinner": [values[3]]}}


def test_allergen_and_diet_keywords_are_rejected():
    cases = [
        ({**BASE_PROFILE, "allergens": ["dairy"]}, item("Paneer Tikka", ["paneer"])),
        ({**BASE_PROFILE, "allergens": ["nuts"]}, item("Peanut Chikki", ["peanut"])),
        ({**BASE_PROFILE, "allergens": ["legumes"]}, item("Besan Chilla", ["besan"])),
        ({**BASE_PROFILE, "is_vegetarian": True}, item("Egg Curry", ["egg"])),
        ({**BASE_PROFILE, "is_vegetarian": True}, item("Fish Curry", ["fish"])),
        ({**BASE_PROFILE, "is_vegetarian": True}, item("Chicken Curry", ["chicken"])),
        ({**BASE_PROFILE, "is_vegetarian": True, "is_vegan": True}, item("Ghee Rice", ["ghee", "rice"])),
        ({**BASE_PROFILE, "is_vegetarian": True, "is_vegan": True}, item("Curd Rice", ["curd", "rice"])),
    ]
    for profile, unsafe in cases:
        errors = validate_plan(plan(unsafe, item("Rice", ["rice"]), item("Apple", ["apple"]), item("Millet", ["millet"])), profile, TARGETS)
        assert any("violates" in error for error in errors)


def test_whole_word_scan_does_not_flag_nutmeg_as_nut():
    profile = {**BASE_PROFILE, "allergens": ["nuts"]}
    errors = validate_plan(plan(item("Nutmeg Porridge", ["nutmeg", "oats"]), item("Rice", ["rice"]), item("Apple", ["apple"]), item("Millet", ["millet"])), profile, TARGETS)
    assert not any("allergen nuts" in error for error in errors)


def test_target_macro_kcal_and_kidney_bounds():
    assert validate_targets(TARGETS, BASE_PROFILE) == []
    bad_macros = {**TARGETS, "protein_g": 10}
    assert any("Macro energy" in error for error in validate_targets(bad_macros, BASE_PROFILE))
    bad_kcal = {**TARGETS, "calories": 1000}
    assert any("Calories must" in error for error in validate_targets(bad_kcal, BASE_PROFILE))
    kidney = {**BASE_PROFILE, "medical_conditions": ["kidney_disease"]}
    assert any("Protein per kg" in error for error in validate_targets(TARGETS, kidney))


def test_hypertension_sodium_cap():
    profile = {**BASE_PROFILE, "medical_conditions": ["hypertension"]}
    unsafe = plan(*[item(f"Dish {index}", ["rice"], sodium=600) for index in range(4)])
    assert any("sodium" in error.lower() for error in validate_plan(unsafe, profile, TARGETS))


def test_recent_dishes_and_trivial_variations_are_rejected():
    repeated = plan(
        item("Punjabi Rajma Masala", ["rajma", "tomato"]),
        item("Jeera Basmati Rice", ["rice"]),
        item("Apple Chaat", ["apple"]),
        item("Vegetable Khichdi", ["rice", "vegetables"]),
    )
    errors = validate_plan(
        repeated,
        BASE_PROFILE,
        TARGETS,
        recent_dishes=["Rajma Masala", "Basmati Rice"],
    )
    assert any("repeats recent dishes" in error for error in errors)
