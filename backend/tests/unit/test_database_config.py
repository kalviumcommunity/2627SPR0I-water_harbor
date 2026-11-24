import os
import subprocess
import sys
import pytest
from tests.database_config import (
    DatabaseConfigurationError,
    are_same_database,
    validate_test_database_url,
)


def test_missing_test_database_url_none():
    """Verify that None raises DatabaseConfigurationError with an actionable message."""
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(None)
    assert "Missing TEST_DATABASE_URL" in str(exc_info.value)
    assert "explicitly configured" in str(exc_info.value)


def test_missing_test_database_url_empty():
    """Verify that an empty string raises DatabaseConfigurationError."""
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url("")
    assert "Missing TEST_DATABASE_URL" in str(exc_info.value)


def test_missing_test_database_url_whitespace():
    """Verify that a whitespace-only string raises DatabaseConfigurationError."""
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url("   \t\n  ")
    assert "Missing TEST_DATABASE_URL" in str(exc_info.value)


def test_invalid_url_format():
    """Verify that an unparseable URL raises DatabaseConfigurationError."""
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url("not_a_valid_url")
    assert "Invalid TEST_DATABASE_URL" in str(exc_info.value)


def test_missing_database_name():
    """Verify that a URL missing a database name raises DatabaseConfigurationError."""
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url("postgresql://localhost:5432/")
    assert "does not specify a target database name" in str(exc_info.value)


def test_reject_identical_database_url():
    """Verify that identical test and dev URLs are rejected."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(dev_url, dev_db_url=dev_url)
    assert "Unsafe test database configuration" in str(exc_info.value)
    assert "same database" in str(exc_info.value)


def test_reject_same_database_different_driver():
    """Verify that URLs pointing to the same DB but with different drivers are rejected."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    test_url = "postgresql://user:pass@localhost:5432/waterpoint_db"
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(test_url, dev_db_url=dev_url)
    assert "Unsafe test database configuration" in str(exc_info.value)


def test_reject_same_database_localhost_and_ip():
    """Verify that localhost and 127.0.0.1 pointing to the same DB are rejected."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    test_url = "postgresql+psycopg://user:pass@127.0.0.1:5432/waterpoint_db"
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(test_url, dev_db_url=dev_url)
    assert "Unsafe test database configuration" in str(exc_info.value)


def test_reject_same_database_omitted_port():
    """Verify that implicit default port 5432 is recognized as the same database."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    test_url = "postgresql+psycopg://user:pass@localhost/waterpoint_db"
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(test_url, dev_db_url=dev_url)
    assert "Unsafe test database configuration" in str(exc_info.value)


def test_reject_same_database_case_insensitive():
    """Verify that database names are compared case-insensitively."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    test_url = "postgresql+psycopg://user:pass@localhost:5432/WATERPOINT_DB"
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(test_url, dev_db_url=dev_url)
    assert "Unsafe test database configuration" in str(exc_info.value)


def test_reject_same_database_with_query_params():
    """Verify that query params do not bypass the same database detection."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    test_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db?sslmode=disable"
    with pytest.raises(DatabaseConfigurationError) as exc_info:
        validate_test_database_url(test_url, dev_db_url=dev_url)
    assert "Unsafe test database configuration" in str(exc_info.value)


def test_accept_distinct_test_database():
    """Verify that a distinct test database is accepted and normalized."""
    dev_url = "postgresql+psycopg://user:pass@localhost:5432/waterpoint_db"
    test_url = "postgresql://user:pass@localhost:5432/waterpoint_test_db"
    result = validate_test_database_url(test_url, dev_db_url=dev_url)
    assert result == "postgresql+psycopg://user:pass@localhost:5432/waterpoint_test_db"


def test_are_same_database_helper():
    """Unit test the are_same_database comparator function directly."""
    assert are_same_database(
        "postgresql+psycopg://u:p@localhost:5432/db",
        "postgresql+psycopg://u:p@localhost:5432/db",
    )
    assert are_same_database(
        "postgresql://localhost:5432/db",
        "postgresql+psycopg://localhost:5432/db",
    )
    assert not are_same_database(
        "postgresql+psycopg://localhost:5432/db_test",
        "postgresql+psycopg://localhost:5432/db_dev",
    )
    assert not are_same_database(
        "postgresql+psycopg://localhost:5432/db",
        "postgresql+psycopg://localhost:5433/db",
    )


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def test_subprocess_conftest_rejects_missing_test_database_url():
    """
    Verify that running/importing conftest in a subprocess without TEST_DATABASE_URL
    terminates with an error and never initializes database fixtures.
    """
    env = {k: v for k, v in os.environ.items() if k != "TEST_DATABASE_URL"}
    env["PYTHONPATH"] = BACKEND_DIR
    result = subprocess.run(
        [sys.executable, "-c", "import tests.conftest"],
        env=env,
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "Missing TEST_DATABASE_URL" in result.stderr


def test_subprocess_conftest_rejects_matching_database_url():
    """
    Verify that running/importing conftest in a subprocess where TEST_DATABASE_URL points
    to DATABASE_URL terminates with an error.
    """
    dev_url = "postgresql+psycopg://localhost:5432/waterpoint_db"
    env = dict(os.environ)
    env["PYTHONPATH"] = BACKEND_DIR
    env["DATABASE_URL"] = dev_url
    env["TEST_DATABASE_URL"] = dev_url
    result = subprocess.run(
        [sys.executable, "-c", "import tests.conftest"],
        env=env,
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "Unsafe test database configuration" in result.stderr
