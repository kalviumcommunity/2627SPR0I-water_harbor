"""
Security and authentication utilities.
"""
from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.config import settings


def verify_staff_key(x_staff_key: Optional[str] = Header(None, alias="X-Staff-Key")) -> str:
    """
    Verify staff access using the shared staff access key header.
    Returns the key on success, or raises 401 Unauthorized if missing/invalid.
    """
    if not x_staff_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff authentication required: missing X-Staff-Key header.",
        )
    if x_staff_key != settings.STAFF_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff authentication failed: invalid X-Staff-Key.",
        )
    return x_staff_key


def verify_demo_staff_token(token: Optional[str]) -> bool:
    """
    Legacy helper for backward compatibility.
    """
    if not token:
        return False
    return token.startswith("demo-staff-token-") or token == "demo-facilities-token"
