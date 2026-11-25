"""
Security, Argon2id key verification, and HttpOnly signed session utilities.
"""
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.staff_account import StaffAccount

_password_hasher = PasswordHasher(type=Type.ID)
_DUMMY_KEY_HASH = _password_hasher.hash("dummy-timing-guard-key")


def hash_access_key(plain_key: str) -> str:
    """Hash a plaintext staff access key using Argon2id."""
    if not plain_key or not plain_key.strip():
        raise ValueError("Access key must be a non-empty string.")
    return _password_hasher.hash(plain_key)


def verify_access_key(plain_key: str, key_hash: str) -> bool:
    """Verify a plaintext access key against an Argon2id hash."""
    if not plain_key or not key_hash:
        return False
    try:
        return _password_hasher.verify(key_hash, plain_key)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def authenticate_staff_by_key(db: Session, access_key: str) -> Optional[StaffAccount]:
    """
    Identify and authenticate an active StaffAccount from a submitted access key.
    Returns the matching active StaffAccount, or None if invalid/inactive.
    """
    if not access_key or not access_key.strip():
        verify_access_key("invalid-key", _DUMMY_KEY_HASH)
        return None

    active_accounts = (
        db.query(StaffAccount)
        .filter(StaffAccount.is_active.is_(True))
        .order_by(StaffAccount.id.asc())
        .all()
    )

    matched_account: Optional[StaffAccount] = None
    for account in active_accounts:
        if verify_access_key(access_key, account.access_key_hash):
            matched_account = account

    if matched_account is None:
        if not active_accounts:
            verify_access_key(access_key, _DUMMY_KEY_HASH)
        return None

    return matched_account


def create_staff_session_token(
    staff: StaffAccount,
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, datetime]:
    """
    Create a signed JWT staff session token containing a session-bound CSRF token.
    Returns (encoded_token, csrf_token, expires_at).
    """
    now = datetime.now(timezone.utc)
    delta = expires_delta or timedelta(minutes=settings.STAFF_SESSION_EXPIRE_MINUTES)
    expires_at = now + delta
    csrf_token = secrets.token_urlsafe(32)

    payload = {
        "sub": str(staff.id),
        "staff_identifier": staff.identifier,
        "display_name": staff.display_name,
        "csrf": csrf_token,
        "type": "staff_session",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.session_secret, algorithm=settings.JWT_ALGORITHM)
    return token, csrf_token, expires_at


def decode_staff_session_token(token: str) -> dict:
    """Decode and validate a signed staff session JWT."""
    try:
        payload = jwt.decode(
            token,
            settings.session_secret,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub", "csrf", "type"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff session has expired. Please sign in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid staff session.",
        )

    if payload.get("type") != "staff_session":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid staff session token type.",
        )
    return payload


def is_secure_cookie_request(request: Request) -> bool:
    """Determine whether cookies should carry the Secure attribute."""
    if settings.SESSION_COOKIE_SECURE is not None:
        return settings.SESSION_COOKIE_SECURE
    return request.url.scheme == "https"


def set_staff_session_cookies(
    response: Response,
    request: Request,
    session_token: str,
    csrf_token: str,
    max_age_seconds: int,
) -> None:
    """Attach HttpOnly session cookie and readable CSRF token cookie."""
    secure = is_secure_cookie_request(request)
    response.set_cookie(
        key=settings.STAFF_SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=secure,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=max_age_seconds,
        path="/",
    )
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=secure,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=max_age_seconds,
        path="/",
    )


def clear_staff_session_cookies(response: Response, request: Request) -> None:
    """Remove staff session and CSRF cookies."""
    secure = is_secure_cookie_request(request)
    response.delete_cookie(
        key=settings.STAFF_SESSION_COOKIE_NAME,
        path="/",
        secure=secure,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=settings.CSRF_COOKIE_NAME,
        path="/",
        secure=secure,
        samesite=settings.SESSION_COOKIE_SAMESITE,
    )


def get_current_staff_session(
    request: Request,
    db: Session = Depends(get_db),
) -> Tuple[StaffAccount, dict]:
    """Validate the HttpOnly staff session cookie and return (StaffAccount, claims)."""
    token = request.cookies.get(settings.STAFF_SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff authentication required.",
        )

    payload = decode_staff_session_token(token)
    try:
        staff_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid staff session subject.",
        )

    staff = (
        db.query(StaffAccount)
        .filter(StaffAccount.id == staff_id, StaffAccount.is_active.is_(True))
        .first()
    )
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff session is no longer active.",
        )

    return staff, payload


def require_staff_session(
    session_data: Tuple[StaffAccount, dict] = Depends(get_current_staff_session),
) -> StaffAccount:
    """Require a valid authenticated staff session for read operations."""
    staff, _ = session_data
    return staff


def require_staff_session_with_csrf(
    request: Request,
    session_data: Tuple[StaffAccount, dict] = Depends(get_current_staff_session),
) -> StaffAccount:
    """
    Require both a valid authenticated staff session cookie and a matching
    X-CSRF-Token header bound to the session token.
    """
    staff, payload = session_data
    csrf_header = request.headers.get("X-CSRF-Token")
    expected_csrf = payload.get("csrf")

    if not csrf_header or not expected_csrf or not hmac.compare_digest(csrf_header, expected_csrf):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF verification failed: missing or invalid X-CSRF-Token header.",
        )

    return staff
