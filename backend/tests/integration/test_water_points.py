import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import WaterPoint


@pytest.fixture
def staff_headers() -> dict:
    return {"X-Staff-Key": settings.STAFF_API_KEY}


def test_list_water_points_empty(client: TestClient):
    """Retrieve water points when database is empty (public endpoint)."""
    response = client.get("/api/water-points")
    assert response.status_code == 200
    assert response.json() == []


def test_create_water_point_success(client: TestClient, staff_headers: dict):
    """Create a water point with valid data and staff authentication."""
    payload = {
        "name": "Academic Block A - Floor 1",
        "location": "Near room 102 water dispenser corner",
    }
    response = client.post("/api/water-points", json=payload, headers=staff_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == payload["name"]
    assert data["location"] == payload["location"]
    assert "created_at" in data


def test_create_water_point_missing_staff_key_returns_401(client: TestClient):
    """Creating a water point without staff authentication returns 401 Unauthorized."""
    payload = {
        "name": "Academic Block A - Floor 1",
        "location": "Near room 102 water dispenser corner",
    }
    response = client.post("/api/water-points", json=payload)
    assert response.status_code == 401
    assert "missing x-staff-key" in response.json()["detail"].lower()


def test_create_water_point_invalid_staff_key_returns_401(client: TestClient):
    """Creating a water point with an invalid staff key returns 401 Unauthorized."""
    payload = {
        "name": "Academic Block A - Floor 1",
        "location": "Near room 102 water dispenser corner",
    }
    response = client.post(
        "/api/water-points",
        json=payload,
        headers={"X-Staff-Key": "invalid-staff-key"},
    )
    assert response.status_code == 401
    assert "invalid x-staff-key" in response.json()["detail"].lower()


def test_get_water_point_by_id(client: TestClient, staff_headers: dict):
    """Retrieve an existing water point by ID (public endpoint)."""
    create_res = client.post(
        "/api/water-points",
        json={"name": "Hostel 3 Mess", "location": "Ground Floor Dining Hall"},
        headers=staff_headers,
    )
    assert create_res.status_code == 201
    wp_id = create_res.json()["id"]

    get_res = client.get(f"/api/water-points/{wp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == wp_id
    assert get_res.json()["name"] == "Hostel 3 Mess"
    assert get_res.json()["location"] == "Ground Floor Dining Hall"


def test_get_water_point_not_found(client: TestClient):
    """Retrieve a non-existent water point returns 404."""
    response = client.get("/api/water-points/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_create_water_point_validation_empty_fields(client: TestClient, staff_headers: dict):
    """Validate that blank or whitespace-only names/locations are rejected."""
    # Blank name
    res1 = client.post(
        "/api/water-points",
        json={"name": "   ", "location": "Campus Center"},
        headers=staff_headers,
    )
    assert res1.status_code == 422

    # Blank location
    res2 = client.post(
        "/api/water-points",
        json={"name": "Library", "location": "   "},
        headers=staff_headers,
    )
    assert res2.status_code == 422

    # Missing fields
    res3 = client.post("/api/water-points", json={}, headers=staff_headers)
    assert res3.status_code == 422


def test_create_water_point_with_building(client: TestClient, staff_headers: dict):
    """Create a water point with explicit building field."""
    payload = {
        "name": "Science Block 3rd Floor",
        "location": "Near Physics Lab 301",
        "building": "Science Block",
    }
    response = client.post("/api/water-points", json=payload, headers=staff_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["building"] == "Science Block"


def test_water_point_database_model_persistence(db: Session):
    """Direct SQLAlchemy model persistence and retrieval."""
    wp = WaterPoint(name="Sports Complex", location="Gym Entrance", building="Sports Complex")
    db.add(wp)
    db.commit()
    db.refresh(wp)

    assert wp.id is not None
    retrieved = db.query(WaterPoint).filter(WaterPoint.id == wp.id).first()
    assert retrieved is not None
    assert retrieved.name == "Sports Complex"
    assert retrieved.location == "Gym Entrance"
    assert retrieved.building == "Sports Complex"
    assert retrieved.created_at is not None


def test_public_endpoints_accessible_without_auth(client: TestClient, staff_headers: dict):
    """Verify that student/public endpoints are accessible without authentication."""
    # Create a water point via staff
    wp_res = client.post(
        "/api/water-points",
        json={"name": "Public Water Point", "location": "Campus Plaza"},
        headers=staff_headers,
    )
    assert wp_res.status_code == 201
    wp_id = wp_res.json()["id"]

    # 1. GET /api/water-points is public
    list_res = client.get("/api/water-points")
    assert list_res.status_code == 200

    # 2. GET /api/water-points/{id} is public
    detail_res = client.get(f"/api/water-points/{wp_id}")
    assert detail_res.status_code == 200

    # 3. POST /api/reports is public and anonymous for students
    report_res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Tap handle is loose"},
    )
    assert report_res.status_code == 201
    report_id = report_res.json()["id"]

    # 4. GET /api/reports is public
    reports_res = client.get("/api/reports")
    assert reports_res.status_code == 200

    # 5. GET /api/reports/{id} is public
    single_report_res = client.get(f"/api/reports/{report_id}")
    assert single_report_res.status_code == 200
