from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.report import IssueReportCreate, IssueReportResolve, IssueReportResponse
from app.services.report_service import report_service
from app.core.security import verify_staff_key

router = APIRouter(prefix="/reports", tags=["Issue Reports"])


@router.post("", response_model=IssueReportResponse, status_code=status.HTTP_201_CREATED)
def submit_report(
    report_in: IssueReportCreate,
    db: Session = Depends(get_db),
):
    """
    Submit an unavailable dispenser report.
    Students can submit reports without creating accounts.
    Enforces business rules preventing duplicate active unresolved reports.
    """
    return report_service.create_issue_report(db, report_in)


@router.get("", response_model=List[IssueReportResponse])
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
    """Retrieve issue reports with optional status and water point filtering."""
    return report_service.list_reports(
        db,
        status_filter=status,
        water_point_id=water_point_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{id}", response_model=IssueReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
):
    """Retrieve details of an issue report by ID."""
    return report_service.get_report_or_404(db, report_id=id)


@router.post("/{id}/resolve", response_model=IssueReportResponse)
@router.patch("/{id}/resolve", response_model=IssueReportResponse)
def resolve_report(
    id: int,
    resolve_in: Optional[IssueReportResolve] = None,
    resolved_by: Optional[str] = Query(None, description="Staff identifier or name (fallback)"),
    _staff_key: str = Depends(verify_staff_key),
    db: Session = Depends(get_db),
):
    """
    Confirm resolution of an issue report.
    Authorized facilities staff confirm resolution using X-Staff-Key header.
    Updates report status to staff_confirmed_resolved and sets resolved_at timestamp.
    """
    staff_name = "facilities_staff"
    notes = None
    if resolve_in:
        staff_name = resolve_in.resolved_by or staff_name
        notes = resolve_in.resolution_notes
    elif resolved_by:
        staff_name = resolved_by

    return report_service.resolve_report(
        db,
        report_id=id,
        resolved_by=staff_name,
        resolution_notes=notes,
    )
