from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models import WaterPoint, IssueReport, ReportStatus
from app.schemas import WaterPointCreate, IssueReportCreate


def get_water_point(db: Session, water_point_id: int) -> Optional[WaterPoint]:
    """Retrieve a single water point by ID."""
    return db.query(WaterPoint).filter(WaterPoint.id == water_point_id).first()


def get_water_points(db: Session, skip: int = 0, limit: int = 100) -> List[WaterPoint]:
    """List water points with pagination."""
    return db.query(WaterPoint).order_by(WaterPoint.id.asc()).offset(skip).limit(limit).all()


def create_water_point(db: Session, water_point_in: WaterPointCreate) -> WaterPoint:
    """Create a new campus water point."""
    db_obj = WaterPoint(
        name=water_point_in.name,
        location=water_point_in.location,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_active_report_for_water_point(db: Session, water_point_id: int) -> Optional[IssueReport]:
    """Check if there is an active unresolved report for a water point."""
    return (
        db.query(IssueReport)
        .filter(
            IssueReport.water_point_id == water_point_id,
            IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value,
        )
        .first()
    )


def create_issue_report(db: Session, report_in: IssueReportCreate) -> IssueReport:
    """
    Create a student issue report for an unavailable water point.
    Enforces business rules:
    - Water point must exist.
    - Only one unresolved active report is allowed per water point.
    - If active report exists, return 409 Conflict.
    - Catches DB-level partial unique index constraint violations.
    """
    water_point = get_water_point(db, report_in.water_point_id)
    if not water_point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Water point with id {report_in.water_point_id} not found",
        )

    # Application-level check
    active_report = get_active_report_for_water_point(db, report_in.water_point_id)
    if active_report:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active unresolved report already exists for water point {report_in.water_point_id} (report #{active_report.id}).",
        )

    new_report = IssueReport(
        water_point_id=report_in.water_point_id,
        description=report_in.description,
        status=ReportStatus.REPORTED_UNAVAILABLE.value,
    )
    db.add(new_report)

    # Database-level constraint enforcement
    try:
        db.commit()
        db.refresh(new_report)
        return new_report
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active unresolved report already exists for water point {report_in.water_point_id}.",
        )


def get_issue_report(db: Session, report_id: int) -> Optional[IssueReport]:
    """Retrieve an issue report by ID."""
    return db.query(IssueReport).filter(IssueReport.id == report_id).first()


def get_issue_reports(
    db: Session,
    status_filter: Optional[str] = None,
    water_point_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[IssueReport]:
    """
    Retrieve issue reports with optional status and water point filtering.
    Preserves historical reports; orders by reported_at desc.
    """
    query = db.query(IssueReport)

    if water_point_id is not None:
        query = query.filter(IssueReport.water_point_id == water_point_id)

    if status_filter:
        norm = status_filter.strip().lower().replace("-", "_").replace(" ", "_")
        if norm in (ReportStatus.REPORTED_UNAVAILABLE.value, "unavailable", "reported"):
            query = query.filter(IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value)
        elif norm in (ReportStatus.STAFF_CONFIRMED_RESOLVED.value, "resolved"):
            query = query.filter(IssueReport.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value)
        else:
            query = query.filter(IssueReport.status == status_filter.strip())

    return query.order_by(IssueReport.reported_at.desc()).offset(skip).limit(limit).all()


def resolve_report(
    db: Session,
    report_id: int,
    resolved_by: str,
) -> IssueReport:
    """
    Helper function to mark an issue report as resolved.
    Preserves original report and records resolution timestamp and staff identifier.
    Used for business rule verification and backend service logic.
    """
    report = get_issue_report(db, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with id {report_id} not found",
        )
    if report.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report {report_id} is already resolved.",
        )

    report.status = ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    report.resolved_at = datetime.now(timezone.utc)
    report.resolved_by = resolved_by.strip() if resolved_by else "facilities_staff"
    db.commit()
    db.refresh(report)
    return report

