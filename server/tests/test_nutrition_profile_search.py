import os

import pandas as pd

os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from api.routes.nutrition import _is_allowed, _ranked_matches


def food(name, *, vegetarian, vegan, allergens=""):
    return pd.Series(
        {
            "food_name": name,
            "is_vegetarian": vegetarian,
            "is_vegan": vegan,
            "allergens": allergens,
        }
    )


def test_profile_filters_diet_and_allergens():
    vegan_profile = {"is_vegan": True, "is_vegetarian": True, "allergens": []}
    assert _is_allowed(food("Vegan Poha", vegetarian=True, vegan=True), vegan_profile)
    assert not _is_allowed(food("Paneer Tikka", vegetarian=True, vegan=False, allergens="Milk"), vegan_profile)

    dairy_free = {"allergens": ["dairy"]}
    assert not _is_allowed(food("Palak Paneer", vegetarian=True, vegan=False, allergens="Milk"), dairy_free)

    fish_free = {"allergens": ["fish"]}
    assert not _is_allowed(food("Prawn Curry", vegetarian=False, vegan=False, allergens="Shrimp"), fish_free)


def test_search_ranks_exact_indian_dish_first():
    matches = _ranked_matches("idli", {})
    assert not matches.empty
    assert matches.iloc[0]["food_name"].lower() == "idli"
