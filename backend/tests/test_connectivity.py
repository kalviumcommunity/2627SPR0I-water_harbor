import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.main import app


def test_root_endpoint(client: TestClient):
    """Preserve existing GET / endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "WaterPoint Board API is running"}


def test_health_endpoint(client: TestClient):
    """Preserve existing GET /health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_database_health_check_connected(client: TestClient):
    """Verify GET /health/db endpoint tests live PostgreSQL connection."""
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_direct_sqlalchemy_connection(db: Session):
    """Verify direct SQLAlchemy 2.0 query execution against PostgreSQL."""
    result = db.execute(text("SELECT 1 AS alive")).scalar()
    assert result == 1


def test_database_health_check_failure():
    """Verify GET /health/db returns 503 when connection fails."""
    class BrokenSession:
        def execute(self, *args, **kwargs):
            raise Exception("Simulated connection timeout")

    def broken_db():
        yield BrokenSession()

    app.dependency_overrides[get_db] = broken_db
    try:
        with TestClient(app) as local_client:
            response = local_client.get("/health/db")
            assert response.status_code == 503
            assert "Database connectivity check failed" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

