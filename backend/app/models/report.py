import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.staff_account import StaffAccount
    from app.models.water_point import WaterPoint


class ReportStatus(str, enum.Enum):
    REPORTED_UNAVAILABLE = "reported_unavailable"
    STAFF_CONFIRMED_RESOLVED = "staff_confirmed_resolved"


class IssueReport(Base):
    __tablename__ = "issue_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    water_point_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("water_points.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=ReportStatus.REPORTED_UNAVAILABLE.value,
        index=True,
    )
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolved_by: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
    )

    # Phase B: staff assignment (claiming) and resolver attribution
    assigned_staff_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("staff_accounts.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    assigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolved_by_staff_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("staff_accounts.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    # Phase B: anonymous "I've noticed this too" confirmations (denormalised counter,
    # incremented atomically in the same transaction as the confirmation insert)
    confirmation_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )

    # Phase B: optional photo reference (object-storage key, never a user-supplied name)
    photo_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_content_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    water_point: Mapped["WaterPoint"] = relationship(
        "WaterPoint",
        back_populates="reports",
    )
    assigned_staff: Mapped[Optional["StaffAccount"]] = relationship(
        "StaffAccount",
        foreign_keys=[assigned_staff_id],
    )
    resolved_by_staff: Mapped[Optional["StaffAccount"]] = relationship(
        "StaffAccount",
        foreign_keys=[resolved_by_staff_id],
    )
    confirmations: Mapped[List["ReportConfirmation"]] = relationship(
        "ReportConfirmation",
        back_populates="report",
    )

    # Constraints and Indexes:
    # Partial unique index ensuring only one active unresolved report per water point at DB level
    __table_args__ = (
        Index(
            "uq_active_report_per_water_point",
            "water_point_id",
            unique=True,
            postgresql_where=text("status = 'reported_unavailable'"),
        ),
    )


class ReportConfirmation(Base):
    """
    Anonymous confirmation that another student has noticed the same issue.

    ``participant_hash`` is an HMAC-SHA256 digest of a random, server-issued
    participant token held in an HttpOnly cookie. No IP address, user agent,
    device fingerprint or other personal data is stored.
    """

    __tablename__ = "report_confirmations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("issue_reports.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    participant_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    report: Mapped["IssueReport"] = relationship(
        "IssueReport",
        back_populates="confirmations",
    )

    __table_args__ = (
        UniqueConstraint(
            "report_id",
            "participant_hash",
            name="uq_report_confirmation_participant",
        ),
    )
