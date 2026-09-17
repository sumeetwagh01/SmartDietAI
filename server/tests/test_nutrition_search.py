import os

os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("FIREBASE_PRIVATE_KEY", "test")
os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "test@example.com")
os.environ.setdefault("FIREBASE_WEB_API_KEY", "test")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
os.environ.setdefault("ENVIRONMENT", "test")

from api.routes.nutrition import FOOD_DB, _records


def test_food_search_records_match_frontend_contract():
    matches = FOOD_DB[
        FOOD_DB["food_name"].str.contains("paneer", case=False, regex=False, na=False)
    ].head(3)

    records = _records(matches)

    assert records
    assert all(record["id"] for record in records)
    assert all(record["name"] for record in records)
    assert all("food_name" not in record for record in records)
    assert all("calories" in record for record in records)
