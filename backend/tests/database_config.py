import os
from typing import Optional
from sqlalchemy.engine import make_url
from app.config import settings


class DatabaseConfigurationError(ValueError, RuntimeError):
    """Raised when test database configuration is missing or unsafe."""
    pass


def are_same_database(url1: str, url2: str) -> bool:
    """
    Determines whether two database connection strings point to the same database.
    """
    if not url1 or not url2:
        return False
    if url1.strip() == url2.strip():
        return True

    try:
        u1 = make_url(url1.strip())
        u2 = make_url(url2.strip())
    except Exception:
        return url1.strip() == url2.strip()

    if not u1.database or not u2.database:
        return False

    if u1.database.lower() != u2.database.lower():
        return False

    # Normalize hosts
    local_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "", None}
    h1 = u1.host.lower() if u1.host else None
    h2 = u2.host.lower() if u2.host else None
    same_host = (h1 == h2) or (h1 in local_hosts and h2 in local_hosts)

    # Normalize ports (default 5432 for PostgreSQL)
    p1 = u1.port or (5432 if "postgres" in (u1.drivername or "") else None)
    p2 = u2.port or (5432 if "postgres" in (u2.drivername or "") else None)
    same_port = (p1 == p2)

    return same_host and same_port


def validate_test_database_url(
    test_db_url: Optional[str],
    dev_db_url: Optional[str] = None,
) -> str:
    """
    Validates that TEST_DATABASE_URL is explicitly configured and does not point
    to the development database.

    Raises DatabaseConfigurationError if the configuration is missing or unsafe.
    Returns the normalized test database URL.
    """
    if not test_db_url or not str(test_db_url).strip():
        raise DatabaseConfigurationError(
            "Missing TEST_DATABASE_URL: An explicitly configured TEST_DATABASE_URL environment "
            "variable is required to run backend tests. Tests will not fall back to "
            "DATABASE_URL or the development database to prevent accidental data loss. "
            "Please configure TEST_DATABASE_URL (e.g. TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_test_db)."
        )

    test_db_url = str(test_db_url).strip()
    if test_db_url.startswith("postgresql://"):
        test_db_url = test_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif test_db_url.startswith("postgres://"):
        test_db_url = test_db_url.replace("postgres://", "postgresql+psycopg://", 1)

    try:
        test_url_obj = make_url(test_db_url)
    except Exception as exc:
        raise DatabaseConfigurationError(
            f"Invalid TEST_DATABASE_URL: '{test_db_url}'. Must be a valid database connection URL."
        ) from exc

    if not test_url_obj.database:
        raise DatabaseConfigurationError(
            f"Invalid TEST_DATABASE_URL: '{test_db_url}' does not specify a target database name."
        )

    dev_urls = []
    if dev_db_url:
        dev_urls.append(dev_db_url)
    else:
        env_dev_url = os.getenv("DATABASE_URL")
        if env_dev_url:
            dev_urls.append(env_dev_url)
        if hasattr(settings, "sqlalchemy_database_uri") and settings.sqlalchemy_database_uri:
            dev_urls.append(settings.sqlalchemy_database_uri)

    for dev_url in dev_urls:
        if are_same_database(test_db_url, dev_url):
            raise DatabaseConfigurationError(
                f"Unsafe test database configuration: TEST_DATABASE_URL points to the same "
                f"database as DATABASE_URL ('{test_db_url}'). "
                f"A separate dedicated test database must be configured to prevent "
                f"truncating or modifying development data. "
                f"Please set TEST_DATABASE_URL to a dedicated test database (e.g. waterpoint_test_db)."
            )

    return test_db_url
