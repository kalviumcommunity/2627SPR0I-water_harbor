from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import enforce_login_rate_limit
from app.core.security import (
    authenticate_staff_by_key,
    clear_staff_session_cookies,
    create_staff_session_token,
    get_current_staff_session,
    require_staff_session,
    require_staff_session_with_csrf,
    set_staff_session_cookies,
)
from app.db.session import get_db
from app.models.staff_account import StaffAccount
from app.schemas.report import StaffIssueReportResponse
from app.schemas.staff import (
    StaffAccountPublic,
    StaffLoginRequest,
    StaffLogoutResponse,
    StaffSessionResponse,
)
from app.services.report_service import report_service

router = APIRouter(prefix="/staff", tags=["Staff Authentication & Operations"])


@router.post(
    "/login",
    response_model=StaffSessionResponse,
    dependencies=[Depends(enforce_login_rate_limit)],
)
def staff_login(
    login_in: StaffLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticate a staff member using only their access key and issue an
    expiring signed HttpOnly session cookie plus CSRF token.
    """
    staff = authenticate_staff_by_key(db, login_in.access_key)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid staff access key.",
        )

    session_token, csrf_token, expires_at = create_staff_session_token(staff)
    set_staff_session_cookies(
        response=response,
        request=request,
        session_token=session_token,
        csrf_token=csrf_token,
        max_age_seconds=settings.STAFF_SESSION_EXPIRE_MINUTES * 60,
    )

    return StaffSessionResponse(
        authenticated=True,
        staff=StaffAccountPublic.model_validate(staff),
        csrf_token=csrf_token,
        expires_at=expires_at,
    )


@router.get("/session", response_model=StaffSessionResponse)
def staff_session(
    session_data: Tuple[StaffAccount, dict] = Depends(get_current_staff_session),
):
    """Return the currently authenticated staff session details."""
    staff, payload = session_data
    return StaffSessionResponse(
        authenticated=True,
        staff=StaffAccountPublic.model_validate(staff),
        csrf_token=payload["csrf"],
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )


@router.post("/logout", response_model=StaffLogoutResponse)
def staff_logout(
    request: Request,
    response: Response,
    _staff: StaffAccount = Depends(require_staff_session_with_csrf),
):
    """Terminate the current staff session and clear auth/CSRF cookies."""
    clear_staff_session_cookies(response=response, request=request)
    return StaffLogoutResponse(message="Signed out successfully.")


@router.get("/reports", response_model=List[StaffIssueReportResponse])
def list_staff_reports(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter reports by status (e.g. reported_unavailable, staff_confirmed_resolved)",
    ),
    water_point_id: Optional[int] = Query(
        None,
        description="Filter reports by water point ID",
    ),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    _staff: StaffAccount = Depends(require_staff_session),
    db: Session = Depends(get_db),
):
    """Retrieve full issue reports including staff-only fields for authenticated staff."""
    return report_service.list_reports(
        db,
        status_filter=status_filter,
        water_point_id=water_point_id,
        skip=skip,
        limit=limit,
    )
