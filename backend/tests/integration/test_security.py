import time
import pytest
from datetime import datetime, timedelta, timezone
import jwt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import report_rate_limiter, staff_login_rate_limiter
from app.core.security import hash_access_key
from app.models.staff_account import StaffAccount
from app.models.report import ReportStatus


@pytest.fixture(autouse=True)
def reset_limiters():
    """Reset all in-memory rate limiters before and after each test."""
    report_rate_limiter.reset()
    staff_login_rate_limiter.reset()
    yield
    report_rate_limiter.reset()
    staff_login_rate_limiter.reset()


@pytest.fixture
def disabled_staff(db: Session) -> StaffAccount:
    """Fixture creating an inactive staff account."""
    account = StaffAccount(
        identifier="disabled-guard",
        display_name="Disabled Staff",
        access_key_hash=hash_access_key("disabled-key-123"),
        is_active=False,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


# --------------------------------------------------------------------------
# 1. Staff Authentication Tests
# --------------------------------------------------------------------------

def test_login_invalid_key_returns_401(client: TestClient, active_staff: StaffAccount):
    """Attempting login with an incorrect access key returns 401 Unauthorized."""
    response = client.post("/api/staff/login", json={"access_key": "wrong-access-key"})
    assert response.status_code == 401
    assert "invalid staff access key" in response.json()["detail"].lower()


def test_login_disabled_account_returns_401(client: TestClient, disabled_staff: StaffAccount):
    """Attempting login with key of an inactive account returns 401."""
    response = client.post("/api/staff/login", json={"access_key": "disabled-key-123"})
    assert response.status_code == 401
    assert "invalid staff access key" in response.json()["detail"].lower()


def test_login_valid_key_sets_httponly_cookie_and_returns_session(
    client: TestClient, active_staff: StaffAccount
):
    """Valid access key issues HttpOnly session cookie, CSRF cookie, and session JSON."""
    response = client.post("/api/staff/login", json={"access_key": "test-secure-passkey-2026"})
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["staff"]["identifier"] == active_staff.identifier
    assert data["staff"]["display_name"] == active_staff.display_name
    assert "csrf_token" in data
    assert "expires_at" in data

    # Check cookies
    cookies = response.cookies
    assert settings.STAFF_SESSION_COOKIE_NAME in cookies
    assert settings.CSRF_COOKIE_NAME in cookies


def test_get_session_authenticated_returns_staff_info(
    client: TestClient, active_staff: StaffAccount
):
    """GET /api/staff/session with valid cookie returns active staff session info."""
    login_res = client.post("/api/staff/login", json={"access_key": "test-secure-passkey-2026"})
    assert login_res.status_code == 200

    session_res = client.get("/api/staff/session")
    assert session_res.status_code == 200
    session_data = session_res.json()
    assert session_data["authenticated"] is True
    assert session_data["staff"]["identifier"] == active_staff.identifier
    assert session_data["staff"]["display_name"] == active_staff.display_name


def test_get_session_unauthenticated_returns_401(client: TestClient):
    """GET /api/staff/session without cookie returns 401 Unauthorized."""
    response = client.get("/api/staff/session")
    assert response.status_code == 401
    assert "staff authentication required" in response.json()["detail"].lower()


def test_logout_clears_cookies(client: TestClient, active_staff: StaffAccount):
    """POST /api/staff/logout with valid CSRF clears auth cookies and terminates session."""
    login_res = client.post("/api/staff/login", json={"access_key": "test-secure-passkey-2026"})
    csrf = login_res.json()["csrf_token"]

    logout_res = client.post("/api/staff/logout", headers={"X-CSRF-Token": csrf})
    assert logout_res.status_code == 200

    # Next session check should be 401
    session_res = client.get("/api/staff/session")
    assert session_res.status_code == 401


def test_logout_without_csrf_returns_403(client: TestClient, active_staff: StaffAccount):
    """POST /api/staff/logout without CSRF header returns 403 Forbidden."""
    login_res = client.post("/api/staff/login", json={"access_key": "test-secure-passkey-2026"})
    assert login_res.status_code == 200

    logout_res = client.post("/api/staff/logout")
    assert logout_res.status_code == 403
    assert "csrf verification failed" in logout_res.json()["detail"].lower()


def test_expired_session_returns_401(client: TestClient, active_staff: StaffAccount):
    """An expired JWT session cookie is rejected with 401."""
    # Craft expired token directly
    expired_payload = {
        "sub": str(active_staff.id),
        "identifier": active_staff.identifier,
        "name": active_staff.display_name,
        "csrf": "expired-csrf",
        "type": "staff_session",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
        "iat": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    expired_token = jwt.encode(
        expired_payload,
        settings.session_secret,
        algorithm=settings.JWT_ALGORITHM,
    )

    client.cookies.set(settings.STAFF_SESSION_COOKIE_NAME, expired_token)
    response = client.get("/api/staff/session")
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


# --------------------------------------------------------------------------
# 2. Staff Operations & Identity Derivation
# --------------------------------------------------------------------------

def test_resolve_report_derives_identity_from_session(
    client: TestClient, staff_auth: dict
):
    """
    POST /api/reports/{id}/resolve automatically assigns resolved_by
    from the authenticated StaffAccount display_name, ignoring any client spoofing.
    """
    # Create water point
    wp = client.post(
        "/api/water-points",
        json={"name": "Science Block 1st Floor", "location": "Near Lab 101"},
        headers=staff_auth["headers"],
    ).json()

    # Submit report anonymously
    rep = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Filter clogged"},
    ).json()

    # Resolve report
    res = client.post(
        f"/api/reports/{rep['id']}/resolve",
        json={"resolution_notes": "Cleaned filter screen"},
        headers=staff_auth["headers"],
    )
    assert res.status_code == 200
    resolved = res.json()
    assert resolved["status"] == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    assert resolved["resolved_by"] == staff_auth["staff"].display_name
    assert resolved["resolution_notes"] == "Cleaned filter screen"


# --------------------------------------------------------------------------
# 3. Public API Privacy vs Staff API
# --------------------------------------------------------------------------

def test_public_reports_hide_internal_staff_fields(
    client: TestClient, staff_auth: dict
):
    """
    Public GET /api/reports and GET /api/reports/{id} exclude resolved_by and
    resolution_notes to protect staff privacy.
    """
    wp = client.post(
        "/api/water-points",
        json={"name": "Hostel 2 Mess", "location": "Dining Hall"},
        headers=staff_auth["headers"],
    ).json()

    rep = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Taps dry"},
    ).json()

    client.post(
        f"/api/reports/{rep['id']}/resolve",
        json={"resolution_notes": "Internal facilities maintenance: replaced diaphragm pump."},
        headers=staff_auth["headers"],
    )

    # 1. Check public listing
    public_list = client.get("/api/reports").json()
    assert len(public_list) == 1
    assert "resolved_by" not in public_list[0]
    assert "resolution_notes" not in public_list[0]
    assert public_list[0]["status"] == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    assert public_list[0]["resolved_at"] is not None

    # 2. Check public detail
    public_detail = client.get(f"/api/reports/{rep['id']}").json()
    assert "resolved_by" not in public_detail
    assert "resolution_notes" not in public_detail

    # 3. Check staff-only listing returns internal fields
    staff_list = client.get("/api/staff/reports").json()
    assert len(staff_list) == 1
    assert staff_list[0]["resolved_by"] == staff_auth["staff"].display_name
    assert staff_list[0]["resolution_notes"] == "Internal facilities maintenance: replaced diaphragm pump."


def test_staff_reports_endpoint_unauthenticated_returns_401(client: TestClient):
    """GET /api/staff/reports requires authenticated staff session."""
    # Ensure no cookies
    client.cookies.clear()
    response = client.get("/api/staff/reports")
    assert response.status_code == 401


# --------------------------------------------------------------------------
# 4. Rate Limiting Tests
# --------------------------------------------------------------------------

def test_anonymous_report_rate_limiting_enforced(client: TestClient, staff_auth: dict):
    """
    POST /api/reports triggers HTTP 429 with Retry-After when rate limit is exceeded.
    """
    wp = client.post(
        "/api/water-points",
        json={"name": "Exam Hall", "location": "Main Auditorium"},
        headers=staff_auth["headers"],
    ).json()

    # Settings limit: 5 requests per 60s
    for i in range(5):
        # We resolve each previous report to bypass duplicate active report business rule
        res = client.post(
            "/api/reports",
            json={"water_point_id": wp["id"], "description": f"Test report {i}"},
        )
        assert res.status_code == 201
        report_id = res.json()["id"]
        client.post(f"/api/reports/{report_id}/resolve", headers=staff_auth["headers"])

    # 6th request from same IP should fail with 429
    blocked_res = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Rapid fire 6th report"},
    )
    assert blocked_res.status_code == 429
    assert "Retry-After" in blocked_res.headers
    assert int(blocked_res.headers["Retry-After"]) >= 1


def test_untrusted_forwarded_ip_headers_are_ignored(client: TestClient, staff_auth: dict):
    """
    X-Forwarded-For is ignored when the direct client socket is not in TRUSTED_PROXY_IPS.
    """
    wp = client.post(
        "/api/water-points",
        json={"name": "Bus Stop Point", "location": "North Gate"},
        headers=staff_auth["headers"],
    ).json()

    # Fill rate limit using direct peer IP (testclient default: 'testclient')
    for i in range(5):
        res = client.post(
            "/api/reports",
            json={"water_point_id": wp["id"], "description": f"Legit report {i}"},
        )
        assert res.status_code == 201
        report_id = res.json()["id"]
        client.post(f"/api/reports/{report_id}/resolve", headers=staff_auth["headers"])

    # Attempt to spoof IP via X-Forwarded-For
    spoofed_res = client.post(
        "/api/reports",
        json={"water_point_id": wp["id"], "description": "Spoofed attempt"},
        headers={"X-Forwarded-For": "203.0.113.195"},
    )
    # Must still be blocked because peer 'testclient' is not in TRUSTED_PROXY_IPS
    assert spoofed_res.status_code == 429
