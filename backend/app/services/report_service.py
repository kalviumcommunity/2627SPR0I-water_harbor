from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.report import IssueReport, ReportStatus
from app.schemas.report import IssueReportCreate
from app.repositories.report_repository import report_repo
from app.repositories.water_point_repository import water_point_repo


class ReportService:
    def list_reports(
        self,
        db: Session,
        status_filter: Optional[str] = None,
        water_point_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[IssueReport]:
        return report_repo.get_all(
            db,
            status_filter=status_filter,
            water_point_id=water_point_id,
            skip=skip,
            limit=limit,
        )

    def get_report_or_404(self, db: Session, report_id: int) -> IssueReport:
        report = report_repo.get_by_id(db, report_id=report_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with id {report_id} not found",
            )
        return report

    def create_issue_report(
        self, db: Session, report_in: IssueReportCreate
    ) -> IssueReport:
        """
        Create a student issue report for an unavailable water point.
        Enforces business rules:
        - Water point must exist.
        - Only one unresolved active report is allowed per water point.
        - If active report exists, return 409 Conflict.
        - Catches DB-level partial unique index constraint violations.
        """
        water_point = water_point_repo.get_by_id(db, report_in.water_point_id)
        if not water_point:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Water point with id {report_in.water_point_id} not found",
            )

        # Application-level check
        active_report = report_repo.get_active_by_water_point(db, report_in.water_point_id)
        if active_report:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An active unresolved report already exists for water point {report_in.water_point_id} (report #{active_report.id}).",
            )

        # Database-level constraint enforcement
        try:
            return report_repo.create(
                db,
                water_point_id=report_in.water_point_id,
                description=report_in.description,
            )
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An active unresolved report already exists for water point {report_in.water_point_id}.",
            )

    def resolve_report(
        self, db: Session, report_id: int, resolved_by: str = "facilities_staff"
    ) -> IssueReport:
        """
        Mark an issue report as resolved by facilities staff.
        Preserves original report and records resolution timestamp and staff identifier.
        """
        report = self.get_report_or_404(db, report_id=report_id)
        if report.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Report {report_id} is already resolved.",
            )

        return report_repo.update_status_resolved(
            db, report=report, resolved_by=resolved_by
        )


report_service = ReportService()
