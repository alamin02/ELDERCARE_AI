import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def get_auth_tokens():
    """Helper to retrieve tokens for elderly and caregiver."""
    elderly_res = client.post("/api/v1/auth/login", json={
        "email": "elderly@eldercare.ai",
        "password": "ElderPass123!"
    })
    caregiver_res = client.post("/api/v1/auth/login", json={
        "email": "caregiver@eldercare.ai",
        "password": "CarePass123!"
    })
    return elderly_res.json(), caregiver_res.json()


def test_list_medications_for_elderly():
    """Verify elderly patient can list their own medications."""
    elderly_data, _ = get_auth_tokens()
    token = elderly_data["access_token"]
    elderly_id = elderly_data["elderly_id"]

    res = client.get(
        f"/api/v1/medications?elderly_id={elderly_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    meds = res.json()
    assert len(meds) >= 3
    names = [m["name"] for m in meds]
    assert "Metformin" in names
    assert "Amlodipine" in names


def test_today_schedule_and_logging():
    """Verify today's schedule retrieval and marking dose as taken."""
    elderly_data, _ = get_auth_tokens()
    token = elderly_data["access_token"]
    elderly_id = elderly_data["elderly_id"]

    # 1. Fetch today's schedule
    sched_res = client.get(
        f"/api/v1/medications/today/schedule?elderly_id={elderly_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert sched_res.status_code == 200
    schedule_items = sched_res.json()
    assert len(schedule_items) > 0

    first_item = schedule_items[0]
    med_id = first_item["medication_id"]
    sched_time = first_item["scheduled_time"]

    # 2. Log medication as taken
    log_res = client.post(
        "/api/v1/medications/log",
        json={
            "medication_id": med_id,
            "scheduled_time": sched_time,
            "status": "taken",
            "notes": "Test verification dose taken"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert log_res.status_code == 200
    assert log_res.json()["status"] == "taken"


def test_rbac_unauthorized_elderly_profile_access():
    """CRITICAL SECURITY TEST: Elderly user cannot access another elderly profile."""
    elderly_data, _ = get_auth_tokens()
    token = elderly_data["access_token"]
    own_id = elderly_data["elderly_id"]
    unauthorized_id = own_id + 9999

    # Attempt to query medications for an unauthorized ID
    res = client.get(
        f"/api/v1/medications?elderly_id={unauthorized_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    # Backend RBAC must reject with 403 Forbidden!
    assert res.status_code == 403


def test_caregiver_authorized_ward_access():
    """Verify caregiver can access their authorized linked ward."""
    elderly_data, caregiver_data = get_auth_tokens()
    cg_token = caregiver_data["access_token"]
    ward_elderly_id = elderly_data["elderly_id"]

    res = client.get(
        f"/api/v1/medications?elderly_id={ward_elderly_id}",
        headers={"Authorization": f"Bearer {cg_token}"}
    )
    assert res.status_code == 200
    assert len(res.json()) >= 3


def test_caregiver_unauthorized_ward_access():
    """Verify caregiver is blocked from accessing unlinked elderly profiles."""
    _, caregiver_data = get_auth_tokens()
    cg_token = caregiver_data["access_token"]
    fake_ward_id = 99999

    res = client.get(
        f"/api/v1/medications?elderly_id={fake_ward_id}",
        headers={"Authorization": f"Bearer {cg_token}"}
    )
    assert res.status_code == 403
