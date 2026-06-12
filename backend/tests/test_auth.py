from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register():
    res = client.post("/api/auth/register", json={
        "name": "Test User", "email": "test@example.com", "password": "secret"
    })
    assert res.status_code == 200

def test_health():
    res = client.get("/")
    assert res.json()["status"] == "ok"
