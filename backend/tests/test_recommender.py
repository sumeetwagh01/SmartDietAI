from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recommend():
    res = client.get("/api/diet/recommend/1")
    assert res.status_code == 200
    assert "recommendations" in res.json()
