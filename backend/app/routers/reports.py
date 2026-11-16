from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import IssueReportCreate, IssueReportResolve, IssueReportResponse
from app import crud

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
    return crud.create_issue_report(db, report_in)


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
    """
    Retrieve issue reports with optional status and water point filtering.
    """
    return crud.get_issue_reports(
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
    """
    Retrieve details of an issue report by ID.
    """
    report = crud.get_issue_report(db, report_id=id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id {id} not found",
        )
    return report


@router.post("/{id}/resolve", response_model=IssueReportResponse)
def resolve_report(
    id: int,
    resolve_in: Optional[IssueReportResolve] = None,
    db: Session = Depends(get_db),
):
    """
    Staff endpoint to confirm resolution of an issue report.
    Updates report status to staff_confirmed_resolved and sets resolved_at and resolved_by.
    """
    resolved_by = resolve_in.resolved_by if resolve_in and resolve_in.resolved_by else "facilities_staff"
    return crud.resolve_report(db, report_id=id, resolved_by=resolved_by)

