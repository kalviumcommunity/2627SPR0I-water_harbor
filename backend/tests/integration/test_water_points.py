import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import WaterPoint


def test_list_water_points_empty(client: TestClient):
    """Retrieve water points when database is empty."""
    response = client.get("/api/water-points")
    assert response.status_code == 200
    assert response.json() == []


def test_create_water_point_success(client: TestClient):
    """Create a water point with valid data."""
    payload = {
        "name": "Academic Block A - Floor 1",
        "location": "Near room 102 water dispenser corner",
    }
    response = client.post("/api/water-points", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == payload["name"]
    assert data["location"] == payload["location"]
    assert "created_at" in data


def test_get_water_point_by_id(client: TestClient):
    """Retrieve an existing water point by ID."""
    create_res = client.post(
        "/api/water-points",
        json={"name": "Hostel 3 Mess", "location": "Ground Floor Dining Hall"},
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


def test_create_water_point_validation_empty_fields(client: TestClient):
    """Validate that blank or whitespace-only names/locations are rejected."""
    # Blank name
    res1 = client.post("/api/water-points", json={"name": "   ", "location": "Campus Center"})
    assert res1.status_code == 422

    # Blank location
    res2 = client.post("/api/water-points", json={"name": "Library", "location": "   "})
    assert res2.status_code == 422

    # Missing fields
    res3 = client.post("/api/water-points", json={})
    assert res3.status_code == 422


def test_water_point_database_model_persistence(db: Session):
    """Direct SQLAlchemy model persistence and retrieval."""
    wp = WaterPoint(name="Sports Complex", location="Gym Entrance")
    db.add(wp)
    db.commit()
    db.refresh(wp)

    assert wp.id is not None
    retrieved = db.query(WaterPoint).filter(WaterPoint.id == wp.id).first()
    assert retrieved is not None
    assert retrieved.name == "Sports Complex"
    assert retrieved.location == "Gym Entrance"
    assert retrieved.created_at is not None

