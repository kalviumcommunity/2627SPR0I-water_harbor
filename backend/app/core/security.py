"""
Security and authentication utilities.
"""
from typing import Optional
from app.core.config import settings


def verify_demo_staff_token(token: Optional[str]) -> bool:
    """
    Placeholder verification for demo staff authentication.
    Full JWT validation will be added with user accounts in a future sprint.
    """
    if not token:
        return False
    return token.startswith("demo-staff-token-") or token == "demo-facilities-token"
