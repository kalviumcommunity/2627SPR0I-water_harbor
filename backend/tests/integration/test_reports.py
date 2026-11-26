import pytest
from fastapi.testclient import TestClient
from app.models import ReportStatus
from app.core.rate_limit import report_rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset the in-memory rate limiter before each test."""
    report_rate_limiter.reset()
    yield
    report_rate_limiter.reset()


@pytest.fixture
def sample_water_point(client: TestClient, staff_auth: dict) -> dict:
    """Helper fixture to create a water point for report tests."""
    res = client.post(
        "/api/water-points",
        json={"name": "Library 2nd Floor", "location": "West Wing Study Area"},
        headers=staff_auth["headers"],
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
    # Public schema does NOT expose resolved_by or resolution_notes
    assert "resolved_by" not in data
    assert "resolution_notes" not in data


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


def test_list_reports_with_status_filter(client: TestClient, staff_auth: dict):
    """Test retrieving reports with optional status filtering."""
    # Create two water points
    wp1 = client.post(
        "/api/water-points",
        json={"name": "WP 1", "location": "Loc 1"},
        headers=staff_auth["headers"],
    ).json()
    wp2 = client.post(
        "/api/water-points",
        json={"name": "WP 2", "location": "Loc 2"},
        headers=staff_auth["headers"],
    ).json()

    # Submit reports
    r1 = client.post(
        "/api/reports",
        json={"water_point_id": wp1["id"], "description": "Dispenser 1 faulty"},
    ).json()
    client.post(
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


def test_resolve_report_endpoint_success(client: TestClient, sample_water_point: dict, staff_auth: dict):
    """Staff can confirm resolution via PATCH /api/reports/{id}/resolve with staff auth."""
    wp_id = sample_water_point["id"]
    create_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Filter replacement needed"},
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    assert client.post(f"/api/reports/{report_id}/claim", headers=staff_auth["headers"]).status_code == 200
    res = client.patch(
        f"/api/reports/{report_id}/resolve",
        headers=staff_auth["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    # Derived from authenticated staff account display_name
    assert data["resolved_by"] == "Facilities Lead Officer"
    assert data["resolved_at"] is not None


def test_resolve_post_endpoint_with_notes(client: TestClient, sample_water_point: dict, staff_auth: dict):
    """Staff can confirm resolution via POST /api/reports/{id}/resolve with JSON body notes."""
    wp_id = sample_water_point["id"]
    create_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Water flow stopped"},
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["id"]

    assert client.post(f"/api/reports/{report_id}/claim", headers=staff_auth["headers"]).status_code == 200
    res = client.post(
        f"/api/reports/{report_id}/resolve",
        json={
            "resolution_notes": "Replaced valve cartridge and cleaned aerator.",
        },
        headers=staff_auth["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    assert data["resolved_by"] == "Facilities Lead Officer"
    assert data["resolution_notes"] == "Replaced valve cartridge and cleaned aerator."


def test_resolve_unauthenticated_returns_401(client: TestClient, sample_water_point: dict):
    """Attempting resolution without staff session cookie returns 401 Unauthorized."""
    client.cookies.clear()
    wp_id = sample_water_point["id"]
    create_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Leaking tap"},
    )
    report_id = create_res.json()["id"]

    res = client.post(
        f"/api/reports/{report_id}/resolve",
        json={"resolution_notes": "Attempt without auth"},
    )
    assert res.status_code == 401
    assert "staff authentication required" in res.json()["detail"].lower()


def test_resolve_missing_csrf_returns_403(client: TestClient, sample_water_point: dict, staff_auth: dict):
    """Attempting resolution with session cookie but missing CSRF token returns 403 Forbidden."""
    wp_id = sample_water_point["id"]
    create_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Leaking tap"},
    )
    report_id = create_res.json()["id"]

    # Session cookie exists in client, but we don't send X-CSRF-Token
    res = client.post(
        f"/api/reports/{report_id}/resolve",
        json={"resolution_notes": "Missing CSRF"},
    )
    assert res.status_code == 403
    assert "csrf verification failed" in res.json()["detail"].lower()


def test_resolve_already_resolved_report_endpoint(client: TestClient, sample_water_point: dict, staff_auth: dict):
    """Attempting to resolve an already-resolved report returns 400."""
    wp_id = sample_water_point["id"]
    create_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Taps leaking"},
    )
    report_id = create_res.json()["id"]

    assert client.post(f"/api/reports/{report_id}/claim", headers=staff_auth["headers"]).status_code == 200
    res1 = client.patch(
        f"/api/reports/{report_id}/resolve",
        headers=staff_auth["headers"],
    )
    assert res1.status_code == 200

    res2 = client.patch(
        f"/api/reports/{report_id}/resolve",
        headers=staff_auth["headers"],
    )
    assert res2.status_code == 400
    assert "already resolved" in res2.json()["detail"].lower()


def test_resolve_nonexistent_report_endpoint(client: TestClient, staff_auth: dict):
    """Attempting to resolve a non-existent report returns 404."""
    res = client.patch(
        "/api/reports/77777/resolve",
        headers=staff_auth["headers"],
    )
    assert res.status_code == 404
