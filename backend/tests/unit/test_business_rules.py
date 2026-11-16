import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import IssueReport, ReportStatus, WaterPoint
from app.crud import resolve_report


@pytest.fixture
def test_water_point(client: TestClient) -> dict:
    """Fixture to provide a water point for business rules testing."""
    res = client.post(
        "/api/water-points",
        json={"name": "Hostel 1 Ground Floor", "location": "Near Central Staircase"},
    )
    assert res.status_code == 201
    return res.json()


# --------------------------------------------------------------------------
# 1. Description Validation
# --------------------------------------------------------------------------

def test_description_cannot_be_empty(client: TestClient, test_water_point: dict):
    """Description cannot be empty string."""
    response = client.post(
        "/api/reports",
        json={"water_point_id": test_water_point["id"], "description": ""},
    )
    assert response.status_code == 422


def test_description_cannot_be_whitespace_only(client: TestClient, test_water_point: dict):
    """Description cannot be whitespace-only string."""
    response = client.post(
        "/api/reports",
        json={"water_point_id": test_water_point["id"], "description": "    \t \n   "},
    )
    assert response.status_code == 422


def test_description_cannot_exceed_500_characters(client: TestClient, test_water_point: dict):
    """Description cannot exceed 500 characters."""
    long_desc = "A" * 501
    response = client.post(
        "/api/reports",
        json={"water_point_id": test_water_point["id"], "description": long_desc},
    )
    assert response.status_code == 422


def test_description_whitespace_is_trimmed(client: TestClient, test_water_point: dict):
    """Description has leading and trailing whitespace trimmed upon submission."""
    response = client.post(
        "/api/reports",
        json={
            "water_point_id": test_water_point["id"],
            "description": "   Dispenser tap button is stuck   ",
        },
    )
    assert response.status_code == 201
    assert response.json()["description"] == "Dispenser tap button is stuck"


def test_description_at_max_boundary_500_chars(client: TestClient, test_water_point: dict):
    """Description with exactly 500 characters is accepted."""
    desc_500 = "X" * 500
    response = client.post(
        "/api/reports",
        json={"water_point_id": test_water_point["id"], "description": desc_500},
    )
    assert response.status_code == 201
    assert response.json()["description"] == desc_500


# --------------------------------------------------------------------------
# 2. Duplicate Active Report Prevention
# --------------------------------------------------------------------------

def test_prevent_duplicate_active_report_via_api(client: TestClient, test_water_point: dict):
    """Only one unresolved active report is allowed per water point via API."""
    wp_id = test_water_point["id"]

    # First report succeeds
    res1 = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Water dispenser not cooling."},
    )
    assert res1.status_code == 201

    # Second active report for same water point is rejected with 409 Conflict
    res2 = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Water dispenser is warm."},
    )
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_prevent_duplicate_active_report_at_database_level(db: Session, test_water_point: dict):
    """
    Verify PostgreSQL partial unique index enforces uniqueness at database level
    even when bypassing application-level checks.
    """
    wp_id = test_water_point["id"]

    # Insert first active report directly into DB
    r1 = IssueReport(
        water_point_id=wp_id,
        description="First active report direct to DB",
        status=ReportStatus.REPORTED_UNAVAILABLE.value,
    )
    db.add(r1)
    db.commit()

    # Attempt to insert second active report directly into DB
    r2 = IssueReport(
        water_point_id=wp_id,
        description="Second active report direct to DB",
        status=ReportStatus.REPORTED_UNAVAILABLE.value,
    )
    db.add(r2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


# --------------------------------------------------------------------------
# 3. New Report After Resolution & History Preservation
# --------------------------------------------------------------------------

def test_new_report_allowed_after_resolution(client: TestClient, db: Session, test_water_point: dict):
    """Once a report is resolved, a new report can be submitted for that water point."""
    wp_id = test_water_point["id"]

    # 1. Submit initial report
    res1 = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "First issue: leaking valve"},
    )
    assert res1.status_code == 201
    report1_id = res1.json()["id"]

    # 2. Resolve the report via backend service helper
    resolved_report = resolve_report(db, report_id=report1_id, resolved_by="staff_officer_42")
    assert resolved_report.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    assert resolved_report.resolved_at is not None
    assert resolved_report.resolved_by == "staff_officer_42"

    # 3. Submit a new report for the same water point -> must now succeed!
    res2 = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Second issue: filter replacement required"},
    )
    assert res2.status_code == 201
    report2_id = res2.json()["id"]
    assert report2_id != report1_id

    # 4. Verify historical reports are preserved and both exist in database
    reports_res = client.get(f"/api/reports?water_point_id={wp_id}")
    assert reports_res.status_code == 200
    all_reports = reports_res.json()
    assert len(all_reports) == 2

    # Verify report 1 details are intact
    rep1_found = next(r for r in all_reports if r["id"] == report1_id)
    assert rep1_found["status"] == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    assert rep1_found["resolved_by"] == "staff_officer_42"
    assert rep1_found["description"] == "First issue: leaking valve"

    # Verify report 2 is active
    rep2_found = next(r for r in all_reports if r["id"] == report2_id)
    assert rep2_found["status"] == ReportStatus.REPORTED_UNAVAILABLE.value
    assert rep2_found["resolved_at"] is None
    assert rep2_found["description"] == "Second issue: filter replacement required"


def test_cannot_resolve_already_resolved_report(client: TestClient, db: Session, test_water_point: dict):
    """Attempting to resolve an already resolved report raises error."""
    wp_id = test_water_point["id"]
    res = client.post(
        "/api/reports",
        json={"water_point_id": wp_id, "description": "Needs maintenance"},
    )
    report_id = res.json()["id"]

    # First resolution succeeds
    resolve_report(db, report_id=report_id, resolved_by="staff_1")

    # Second resolution fails
    with pytest.raises(Exception) as excinfo:
        resolve_report(db, report_id=report_id, resolved_by="staff_2")
    assert "already resolved" in str(excinfo.value).lower()


def test_water_point_deletion_restricted_when_reports_exist(db: Session, test_water_point: dict):
    """Verify that deleting a water point with reports is restricted and does not cascade delete."""
    wp_id = test_water_point["id"]
    r = IssueReport(
        water_point_id=wp_id,
        description="Preserved historical report",
        status=ReportStatus.REPORTED_UNAVAILABLE.value,
    )
    db.add(r)
    db.commit()

    wp = db.query(WaterPoint).filter(WaterPoint.id == wp_id).first()
    db.delete(wp)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()

