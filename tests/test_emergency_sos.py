import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def get_tokens():
    elderly_res = client.post("/api/v1/auth/login", json={
        "email": "elderly@eldercare.ai",
        "password": "ElderPass123!"
    })
    caregiver_res = client.post("/api/v1/auth/login", json={
        "email": "caregiver@eldercare.ai",
        "password": "CarePass123!"
    })
    return elderly_res.json(), caregiver_res.json()


def test_emergency_contacts_list():
    """Verify emergency contacts can be retrieved."""
    elderly_data, _ = get_tokens()
    token = elderly_data["access_token"]
    res = client.get("/api/v1/emergency/contacts", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    contacts = res.json()
    assert len(contacts) >= 3


def test_one_tap_sos_trigger_and_simulation_label():
    """Verify SOS trigger creates event with explicitly labeled simulated delivery."""
    elderly_data, caregiver_data = get_tokens()
    e_token = elderly_data["access_token"]
    cg_token = caregiver_data["access_token"]

    sos_res = client.post(
        "/api/v1/emergency/sos",
        json={"notes": "Automated SOS test run"},
        headers={"Authorization": f"Bearer {e_token}"}
    )
    assert sos_res.status_code == 200
    data = sos_res.json()
    assert "event_id" in data
    event_id = data["event_id"]
    # Verify simulated notification status is never falsified as real carrier SMS
    assert data["notification_status"] in ["simulated_sent", "sent"]
    assert data["is_simulated"] is True

    # Verify caregiver receives in-app emergency notification
    notif_res = client.get("/api/v1/emergency/notifications", headers={"Authorization": f"Bearer {cg_token}"})
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    sos_notifs = [n for n in notifs if n["notification_type"] == "emergency_sos"]
    assert len(sos_notifs) > 0

    # Resolve event
    resolve_res = client.post(
        f"/api/v1/emergency/resolve/{event_id}",
        headers={"Authorization": f"Bearer {e_token}"}
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["message"] == "Emergency marked as resolved"
