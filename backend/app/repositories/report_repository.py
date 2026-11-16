from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.report import IssueReport, ReportStatus


class ReportRepository:
    def get_by_id(self, db: Session, report_id: int) -> Optional[IssueReport]:
        """Retrieve an issue report by ID."""
        return db.query(IssueReport).filter(IssueReport.id == report_id).first()

    def get_active_by_water_point(
        self, db: Session, water_point_id: int
    ) -> Optional[IssueReport]:
        """Check if there is an active unresolved report for a water point."""
        return (
            db.query(IssueReport)
            .filter(
                IssueReport.water_point_id == water_point_id,
                IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value,
            )
            .first()
        )

    def get_all(
        self,
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

    def create(
        self, db: Session, water_point_id: int, description: str
    ) -> IssueReport:
        """Add a new issue report record."""
        new_report = IssueReport(
            water_point_id=water_point_id,
            description=description,
            status=ReportStatus.REPORTED_UNAVAILABLE.value,
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report

    def update_status_resolved(
        self,
        db: Session,
        report: IssueReport,
        resolved_by: str,
        resolution_notes: Optional[str] = None,
    ) -> IssueReport:
        """Mark report status resolved with timestamp, resolver, and optional notes."""
        report.status = ReportStatus.STAFF_CONFIRMED_RESOLVED.value
        report.resolved_at = datetime.now(timezone.utc)
        report.resolved_by = resolved_by.strip() if resolved_by else "facilities_staff"
        report.resolution_notes = resolution_notes.strip() if resolution_notes else None
        db.commit()
        db.refresh(report)
        return report


report_repo = ReportRepository()
