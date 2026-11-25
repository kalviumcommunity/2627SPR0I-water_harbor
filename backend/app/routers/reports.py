from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.rate_limit import enforce_report_rate_limit
from app.core.security import require_staff_session_with_csrf
from app.db.session import get_db
from app.models.staff_account import StaffAccount
from app.schemas.report import (
    IssueReportCreate,
    IssueReportResolve,
    PublicIssueReportResponse,
    StaffIssueReportResponse,
)
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Issue Reports"])


@router.post(
    "",
    response_model=PublicIssueReportResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(enforce_report_rate_limit)],
)
def submit_report(
    report_in: IssueReportCreate,
    db: Session = Depends(get_db),
):
    """
    Submit an unavailable dispenser report.
    Students can submit reports anonymously without creating accounts.
    Protected by IP-based rate limiting and duplicate active report rules.
    """
    return report_service.create_issue_report(db, report_in)


@router.get("", response_model=List[PublicIssueReportResponse])
def list_reports(
    status: Optional[str] = Query(
        None,
        description="Filter reports by status (e.g. reported_unavailable, staff_confirmed_resolved)",
    ),
    water_point_id: Optional[int] = Query(
        None,
        description="Filter reports by water point ID",
    ),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    db: Session = Depends(get_db),
):
    """Retrieve public issue reports without exposing internal staff-only details."""
    return report_service.list_reports(
        db,
        status_filter=status,
        water_point_id=water_point_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{id}", response_model=PublicIssueReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
):
    """Retrieve public details of an issue report by ID."""
    return report_service.get_report_or_404(db, report_id=id)


@router.post("/{id}/resolve", response_model=StaffIssueReportResponse)
@router.patch("/{id}/resolve", response_model=StaffIssueReportResponse)
def resolve_report(
    id: int,
    resolve_in: Optional[IssueReportResolve] = None,
    current_staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """
    Confirm resolution of an issue report.
    Requires an authenticated staff session and CSRF token.
    Derives resolving staff identity from the authenticated StaffAccount session.
    """
    notes = resolve_in.resolution_notes if resolve_in else None

    return report_service.resolve_report(
        db,
        report_id=id,
        resolved_by=current_staff.display_name,
        resolution_notes=notes,
    )
