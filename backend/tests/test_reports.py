import pytest
from fastapi.testclient import TestClient
from app.models import ReportStatus


@pytest.fixture
def sample_water_point(client: TestClient) -> dict:
    """Helper fixture to create a water point for report tests."""
    res = client.post(
        "/api/water-points",
        json={"name": "Library 2nd Floor", "location": "West Wing Study Area"},
    )
    assert res.status_code == 201
    return res.json()


def test_submit_report_success(client: TestClient, sample_water_point: dict):
    """Students can submit a report without logging in."""
    wp_id = sample_water_point["id"]
    payload = {
        "water_point_id": wp_id,
        "description": "Cold water tap is leaking and water pressure is very low.",
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["water_point_id"] == wp_id
    assert data["description"] == payload["description"]
    assert data["status"] == ReportStatus.REPORTED_UNAVAILABLE.value
    assert data["reported_at"] is not None
    assert data["resolved_at"] is None
    assert data["resolved_by"] is None


def test_submit_report_nonexistent_water_point(client: TestClient):
    """Submitting report for non-existent water point returns 404."""
    payload = {
        "water_point_id": 99999,
        "description": "Machine not dispensing water.",
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_report_by_id(client: TestClient, sample_water_point: dict):
    """Retrieve report details by ID."""
    wp_id = sample_water_point["id"]
    create_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "No water flow from any tap"},
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    get_res = client.get(f"/api/reports/{report_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == report_id
    assert get_res.json()["water_point_id"] == wp_id
    assert get_res.json()["status"] == ReportStatus.REPORTED_UNAVAILABLE.value


def test_get_report_not_found(client: TestClient):
    """Retrieving a non-existent report returns 404."""
    response = client.get("/api/reports/88888")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_reports_with_status_filter(client: TestClient):
    """Test retrieving reports with optional status filtering."""
    # Create two water points
    wp1 = client.post("/api/water-points", json={"name": "WP 1", "location": "Loc 1"}).json()
    wp2 = client.post("/api/water-points", json={"name": "WP 2", "location": "Loc 2"}).json()

    # Submit reports
    r1 = client.post(
        "/api/reports",
        json={"water_point_id": wp1["id"], "description": "Dispenser 1 faulty"},
    ).json()
    r2 = client.post(
        "/api/reports",
        json={"water_point_id": wp2["id"], "description": "Dispenser 2 noisy"},
    ).json()

    # List all
    all_reports = client.get("/api/reports").json()
    assert len(all_reports) == 2

    # Filter by reported_unavailable
    active_reports = client.get("/api/reports?status=reported_unavailable").json()
    assert len(active_reports) == 2

    # Filter by staff_confirmed_resolved (none yet)
    resolved_reports = client.get("/api/reports?status=staff_confirmed_resolved").json()
    assert len(resolved_reports) == 0

    # Filter by specific water point
    wp1_reports = client.get(f"/api/reports?water_point_id={wp1['id']}").json()
    assert len(wp1_reports) == 1
    assert wp1_reports[0]["id"] == r1["id"]

