"""
Privacy-conscious anonymous participant identity for student confirmations.

A random 256-bit token is issued by the server in an HttpOnly cookie. Only an
HMAC-SHA256 digest of that token (keyed with the server session secret and a
domain-separation label) is stored in PostgreSQL. No IP address, user agent,
device fingerprint or personal data is stored or derived.
"""
import hashlib
import hmac
import re
import secrets
from typing import Tuple

from fastapi import Request, Response

from app.core.config import settings
from app.core.security import is_secure_cookie_request

_TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9_\-]{32,128}$")
_HASH_LABEL = b"water-harbor:participant:v1:"


def hash_participant_token(token: str) -> str:
    key = _HASH_LABEL + settings.session_secret.encode("utf-8")
    return hmac.new(key, token.encode("utf-8"), hashlib.sha256).hexdigest()


def get_or_issue_participant(request: Request) -> Tuple[str, bool]:
    """Return (token, is_new). Invalid or missing cookies produce a fresh token."""
    token = request.cookies.get(settings.PARTICIPANT_COOKIE_NAME)
    if token and _TOKEN_PATTERN.match(token):
        return token, False
    return secrets.token_urlsafe(32), True


def read_participant_hash(request: Request):
    token = request.cookies.get(settings.PARTICIPANT_COOKIE_NAME)
    if token and _TOKEN_PATTERN.match(token):
        return hash_participant_token(token)
    return None


def set_participant_cookie(response: Response, request: Request, token: str) -> None:
    response.set_cookie(
        key=settings.PARTICIPANT_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_secure_cookie_request(request),
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.PARTICIPANT_COOKIE_MAX_AGE_DAYS * 24 * 3600,
        path="/",
    )
