import pytest
from pydantic import ValidationError
from starlette.requests import Request

from app.core.config import Settings
from app.core.security import is_secure_cookie_request


def test_development_allows_ephemeral_session_secret():
    """Local development generates a strong ephemeral secret when SESSION_SECRET_KEY is omitted."""
    dev_settings = Settings(_env_file=None, ENVIRONMENT="development")
    assert dev_settings.ENVIRONMENT == "development"
    assert dev_settings.SESSION_SECRET_KEY is None
    assert len(dev_settings.session_secret) >= 32

    # Different instances without explicit secret get distinct ephemeral secrets
    dev_settings_2 = Settings(_env_file=None, ENVIRONMENT="development")
    assert dev_settings.session_secret != dev_settings_2.session_secret


def test_production_requires_explicit_session_secret():
    """Production rejects missing or empty SESSION_SECRET_KEY."""
    with pytest.raises(ValidationError, match="SESSION_SECRET_KEY"):
        Settings(_env_file=None, ENVIRONMENT="production")

    with pytest.raises(ValidationError, match="SESSION_SECRET_KEY"):
        Settings(_env_file=None, ENVIRONMENT="production", SESSION_SECRET_KEY="   ")


def test_production_rejects_short_session_secret():
    """Production requires SESSION_SECRET_KEY to be at least 32 characters long."""
    with pytest.raises(ValidationError, match="32 characters"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SESSION_SECRET_KEY="too-short-secret-key",
        )


def test_production_forbids_legacy_jwt_secret_fallback():
    """Production does not allow falling back to JWT_SECRET_KEY when SESSION_SECRET_KEY is missing."""
    with pytest.raises(ValidationError, match="SESSION_SECRET_KEY"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            JWT_SECRET_KEY="A" * 48,
        )


def test_production_requires_secure_cookies():
    """Production forces SESSION_COOKIE_SECURE=True and rejects False."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SESSION_SECRET_KEY="S" * 48,
    )
    assert prod_settings.SESSION_COOKIE_SECURE is True
    assert prod_settings.session_secret == "S" * 48

    with pytest.raises(ValidationError, match="SESSION_COOKIE_SECURE"):
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SESSION_SECRET_KEY="S" * 48,
            SESSION_COOKIE_SECURE=False,
        )


def test_is_secure_cookie_request_enforced_in_production(monkeypatch):
    """is_secure_cookie_request always returns True in production."""
    from app.core import security

    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SESSION_SECRET_KEY="S" * 48,
    )
    monkeypatch.setattr(security, "settings", prod_settings)

    http_request = Request(
        {
            "type": "http",
            "scheme": "http",
            "method": "GET",
            "path": "/api/staff/login",
            "headers": [],
        }
    )
    assert is_secure_cookie_request(http_request) is True
