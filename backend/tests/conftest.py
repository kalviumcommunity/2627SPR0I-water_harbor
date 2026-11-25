import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.database import Base, get_db
from app.main import app
from app.models.staff_account import StaffAccount
from app.core.security import hash_access_key
from tests.database_config import (
    DatabaseConfigurationError,
    are_same_database,
    validate_test_database_url,
)

# Validate TEST_DATABASE_URL before creating tables, connecting, or truncating
test_db_url = validate_test_database_url(os.getenv("TEST_DATABASE_URL"))

test_engine = create_engine(test_db_url, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Ensure schema exists on the target test database
Base.metadata.create_all(bind=test_engine)


@pytest.fixture(scope="function")
def db() -> Session:
    """
    Provides a clean database session for each test.
    Truncates tables before the test starts to ensure isolation.
    """
    from app.core.rate_limit import report_rate_limiter, staff_login_rate_limiter
    report_rate_limiter.reset()
    staff_login_rate_limiter.reset()

    validate_test_database_url(test_db_url)
    with test_engine.connect() as conn:
        conn.execute(
            text(
                "TRUNCATE TABLE issue_reports, water_points, staff_accounts RESTART IDENTITY CASCADE;"
            )
        )
        conn.commit()

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        report_rate_limiter.reset()
        staff_login_rate_limiter.reset()


@pytest.fixture(scope="function")
def client(db: Session) -> TestClient:
    """
    FastAPI TestClient with the get_db dependency overridden to use the test session.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def active_staff(db: Session) -> StaffAccount:
    """Fixture providing a test active staff account."""
    account = StaffAccount(
        identifier="facilities-lead",
        display_name="Facilities Lead Officer",
        access_key_hash=hash_access_key("test-secure-passkey-2026"),
        is_active=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@pytest.fixture
def staff_auth(client: TestClient, active_staff: StaffAccount) -> dict:
    """
    Fixture that logs in via POST /api/staff/login and returns
    cookies dict and CSRF header dictionary for authenticated operations.
    """
    from app.core.rate_limit import staff_login_rate_limiter
    staff_login_rate_limiter.reset()
    res = client.post("/api/staff/login", json={"access_key": "test-secure-passkey-2026"})
    assert res.status_code == 200
    csrf_token = res.json()["csrf_token"]
    return {
        "csrf_token": csrf_token,
        "headers": {"X-CSRF-Token": csrf_token},
        "staff": active_staff,
    }
