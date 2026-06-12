from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_allergen_detect():
    res = client.post("/api/allergen/detect", json={"name": "Peanut Butter Toast"})
    assert res.status_code == 200
    assert "allergens_detected" in res.json()
