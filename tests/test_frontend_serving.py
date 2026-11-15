import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_serve_frontend_index():
    """Verify FastAPI successfully serves the built React frontend at root."""
    res = client.get("/")
    assert res.status_code == 200
    assert "<title>ElderCare AI" in res.text
    assert '<div id="root">' in res.text


def test_api_routes_not_shadowed_by_frontend():
    """Verify /api routes are preserved and not caught by frontend SPA fallback."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
