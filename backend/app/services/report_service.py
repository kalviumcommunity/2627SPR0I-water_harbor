from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.report import IssueReport, ReportStatus
from app.models.staff_account import StaffAccount
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
        self,
        db: Session,
        report_in: IssueReportCreate,
        photo_key: Optional[str] = None,
        photo_content_type: Optional[str] = None,
    ) -> IssueReport:
        """
        Create a student issue report for an unavailable water point.
        Enforces business rules:
        - Water point must exist and be active.
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
        if not water_point.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This water point is currently inactive and cannot accept new reports.",
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
                photo_key=photo_key,
                photo_content_type=photo_content_type,
            )
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An active unresolved report already exists for water point {report_in.water_point_id}.",
            )

    def claim_report(
        self,
        db: Session,
        report_id: int,
        staff: StaffAccount,
    ) -> IssueReport:
        """
        Atomically claim an unassigned issue report for the authenticated staff member.
        Returns 409 Conflict if another staff member has already claimed it.
        """
        claimed = report_repo.claim_atomic(db, report_id=report_id, staff_id=staff.id)
        db.expire_all()
        report = self.get_report_or_404(db, report_id=report_id)
        if claimed:
            return report

        if report.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Report {report_id} is already resolved and cannot be claimed.",
            )

        holder_name = (
            report.assigned_staff.display_name
            if report.assigned_staff is not None
            else "another staff member"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This issue has already been claimed by {holder_name}.",
        )

    def confirm_report(
        self,
        db: Session,
        report_id: int,
        participant_hash: str,
    ) -> Tuple[int, bool]:
        """
        Record an anonymous "I've noticed this too" confirmation for an active report.
        Returns (confirmation_count, created).
        """
        report = self.get_report_or_404(db, report_id=report_id)
        if report.status != ReportStatus.REPORTED_UNAVAILABLE.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active unresolved reports can be confirmed.",
            )
        outcome, count = report_repo.add_confirmation(
            db, report_id=report_id, participant_hash=participant_hash
        )
        if outcome == "duplicate":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already confirmed this issue.",
            )
        if outcome == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with id {report_id} not found",
            )
        if outcome == "inactive":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active unresolved reports can be confirmed.",
            )
        return count, True

    def resolve_report(
        self,
        db: Session,
        report_id: int,
        resolved_by: str = "facilities_staff",
        resolution_notes: Optional[str] = None,
        resolved_by_staff_id: Optional[int] = None,
    ) -> IssueReport:
        """
        Mark an issue report as resolved by facilities staff.
        When called from an authenticated staff endpoint (resolved_by_staff_id is set),
        enforces that the report is claimed and assigned to that staff member.
        """
        report = self.get_report_or_404(db, report_id=report_id)
        if report.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Report {report_id} is already resolved.",
            )

        if resolved_by_staff_id is not None:
            if report.assigned_staff_id is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This issue must be claimed before it can be resolved.",
                )
            if report.assigned_staff_id != resolved_by_staff_id:
                holder_name = (
                    report.assigned_staff.display_name
                    if report.assigned_staff is not None
                    else "another staff member"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Only the assigned staff member ({holder_name}) can resolve this issue.",
                )

        return report_repo.update_status_resolved(
            db,
            report=report,
            resolved_by=resolved_by,
            resolution_notes=resolution_notes,
            resolved_by_staff_id=resolved_by_staff_id,
        )


report_service = ReportService()
