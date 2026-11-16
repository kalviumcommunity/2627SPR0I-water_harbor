"""
CRUD operations module (re-exports and delegates to services and repositories).
Preserves existing function signatures for backward compatibility with tests.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.water_point import WaterPoint
from app.models.report import IssueReport
from app.schemas.water_point import WaterPointCreate
from app.schemas.report import IssueReportCreate
from app.repositories.water_point_repository import water_point_repo
from app.repositories.report_repository import report_repo
from app.services.water_point_service import water_point_service
from app.services.report_service import report_service


def get_water_point(db: Session, water_point_id: int) -> Optional[WaterPoint]:
    """Retrieve a single water point by ID."""
    return water_point_repo.get_by_id(db, water_point_id=water_point_id)


def get_water_points(db: Session, skip: int = 0, limit: int = 100) -> List[WaterPoint]:
    """List water points with pagination."""
    return water_point_service.list_water_points(db, skip=skip, limit=limit)


def create_water_point(db: Session, water_point_in: WaterPointCreate) -> WaterPoint:
    """Create a new campus water point."""
    return water_point_service.create_water_point(db, water_point_in)


def get_active_report_for_water_point(db: Session, water_point_id: int) -> Optional[IssueReport]:
    """Check if there is an active unresolved report for a water point."""
    return report_repo.get_active_by_water_point(db, water_point_id)


def create_issue_report(db: Session, report_in: IssueReportCreate) -> IssueReport:
    """Create a student issue report for an unavailable water point."""
    return report_service.create_issue_report(db, report_in)


def get_issue_report(db: Session, report_id: int) -> Optional[IssueReport]:
    """Retrieve an issue report by ID."""
    return report_repo.get_by_id(db, report_id)


def get_issue_reports(
    db: Session,
    status_filter: Optional[str] = None,
    water_point_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[IssueReport]:
    """Retrieve issue reports with optional status and water point filtering."""
    return report_service.list_reports(
        db,
        status_filter=status_filter,
        water_point_id=water_point_id,
        skip=skip,
        limit=limit,
    )


def resolve_report(
    db: Session,
    report_id: int,
    resolved_by: str = "facilities_staff",
) -> IssueReport:
    """Helper function to mark an issue report as resolved."""
    return report_service.resolve_report(db, report_id=report_id, resolved_by=resolved_by)
