import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.database import Base, get_db
from app.main import app

# Determine test database URL
test_db_url = os.getenv("TEST_DATABASE_URL")
if not test_db_url:
    # Try connecting to waterpoint_test_db, fallback to main database
    default_test_url = settings.sqlalchemy_database_uri.replace("waterpoint_db", "waterpoint_test_db")
    try:
        tmp_engine = create_engine(default_test_url)
        with tmp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        test_db_url = default_test_url
    except Exception:
        test_db_url = settings.sqlalchemy_database_uri

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
    with test_engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE issue_reports, water_points RESTART IDENTITY CASCADE;"))
        conn.commit()

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


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

