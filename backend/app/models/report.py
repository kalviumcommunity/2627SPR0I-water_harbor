import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

if TYPE_CHECKING:
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

    # Relationships
    water_point: Mapped["WaterPoint"] = relationship(
        "WaterPoint",
        back_populates="reports",
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
