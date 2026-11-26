from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from app.models.report import IssueReport, ReportConfirmation, ReportStatus


class ReportRepository:
    def get_by_id(self, db: Session, report_id: int) -> Optional[IssueReport]:
        """Retrieve an issue report by ID."""
        return (
            db.query(IssueReport)
            .options(joinedload(IssueReport.assigned_staff))
            .filter(IssueReport.id == report_id)
            .first()
        )

    def get_active_by_water_point(
        self, db: Session, water_point_id: int
    ) -> Optional[IssueReport]:
        """Check if there is an active unresolved report for a water point."""
        return (
            db.query(IssueReport)
            .options(joinedload(IssueReport.assigned_staff))
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
        query = db.query(IssueReport).options(joinedload(IssueReport.assigned_staff))

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
        self,
        db: Session,
        water_point_id: int,
        description: str,
        photo_key: Optional[str] = None,
        photo_content_type: Optional[str] = None,
    ) -> IssueReport:
        """Add a new issue report record."""
        new_report = IssueReport(
            water_point_id=water_point_id,
            description=description,
            status=ReportStatus.REPORTED_UNAVAILABLE.value,
            photo_key=photo_key,
            photo_content_type=photo_content_type,
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report

    def claim_atomic(
        self,
        db: Session,
        report_id: int,
        staff_id: int,
    ) -> bool:
        """
        Atomically claim an unassigned, unresolved report at the database level.
        Returns True if this call claimed the row, False if it was already claimed,
        resolved, or missing.
        """
        now = datetime.now(timezone.utc)
        stmt = (
            update(IssueReport)
            .where(
                IssueReport.id == report_id,
                IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value,
                IssueReport.assigned_staff_id.is_(None),
            )
            .values(
                assigned_staff_id=staff_id,
                assigned_at=now,
            )
        )
        result = db.execute(stmt)
        db.commit()
        return (result.rowcount or 0) == 1

    def add_confirmation(
        self,
        db: Session,
        report_id: int,
        participant_hash: str,
    ) -> Tuple[str, int]:
        """
        Atomically record an anonymous participant confirmation and increment
        ``confirmation_count`` only if the report is still active
        (status == 'reported_unavailable').

        Returns (outcome, count) where outcome is one of:
        - "created": confirmation recorded and count incremented in one transaction
        - "duplicate": participant already confirmed this report
        - "inactive": report was concurrently resolved or does not exist
        """
        confirmation = ReportConfirmation(
            report_id=report_id,
            participant_hash=participant_hash,
        )
        db.add(confirmation)
        try:
            db.flush()
        except IntegrityError as exc:
            db.rollback()
            diag = getattr(getattr(exc, "orig", None), "diag", None)
            constraint_name = getattr(diag, "constraint_name", None)
            if constraint_name == "uq_report_confirmation_participant" or (
                "uq_report_confirmation_participant" in str(getattr(exc, "orig", exc))
            ):
                report = self.get_by_id(db, report_id)
                return "duplicate", report.confirmation_count if report else 0
            raise

        stmt = (
            update(IssueReport)
            .where(
                IssueReport.id == report_id,
                IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value,
            )
            .values(confirmation_count=IssueReport.confirmation_count + 1)
            .returning(IssueReport.confirmation_count)
        )
        new_count = db.execute(stmt).scalar_one_or_none()
        if new_count is None:
            db.rollback()
            report = self.get_by_id(db, report_id)
            if report is None:
                return "not_found", 0
            return "inactive", report.confirmation_count

        db.commit()
        return "created", int(new_count)

    def get_confirmed_report_ids(self, db: Session, participant_hash: str) -> List[int]:
        rows = (
            db.query(ReportConfirmation.report_id)
            .filter(ReportConfirmation.participant_hash == participant_hash)
            .all()
        )
        return [r[0] for r in rows]

    def update_status_resolved(
        self,
        db: Session,
        report: IssueReport,
        resolved_by: str,
        resolution_notes: Optional[str] = None,
        resolved_by_staff_id: Optional[int] = None,
    ) -> IssueReport:
        """Mark report status resolved with timestamp, resolver, and optional notes."""
        report.status = ReportStatus.STAFF_CONFIRMED_RESOLVED.value
        report.resolved_at = datetime.now(timezone.utc)
        report.resolved_by = resolved_by.strip() if resolved_by else "facilities_staff"
        report.resolution_notes = resolution_notes.strip() if resolution_notes else None
        if resolved_by_staff_id is not None:
            report.resolved_by_staff_id = resolved_by_staff_id
        db.commit()
        db.refresh(report)
        return report


report_repo = ReportRepository()
