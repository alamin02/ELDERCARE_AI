import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health check endpoint returns 200."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ElderCare AI" in data["service"]


def test_login_success():
    """Verify successful login for seeded elderly user."""
    response = client.post("/api/v1/auth/login", json={
        "email": "elderly@eldercare.ai",
        "password": "ElderPass123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "elderly"
    assert data["elderly_id"] is not None
    assert data["full_name"] == "Abdul Rahman"


def test_login_invalid_password():
    """Verify login rejection with invalid credentials."""
    response = client.post("/api/v1/auth/login", json={
        "email": "elderly@eldercare.ai",
        "password": "WrongPassword999!"
    })
    assert response.status_code == 401


def test_me_endpoint_with_valid_token():
    """Verify /auth/me returns current user profile."""
    # First login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "elderly@eldercare.ai",
        "password": "ElderPass123!"
    })
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "elderly@eldercare.ai"
    assert data["role"] == "elderly"


def test_protected_endpoint_without_token():
    """Verify protected endpoint blocks requests without token."""
    response = client.get("/api/v1/elderly/profile")
    assert response.status_code in [401, 403]
