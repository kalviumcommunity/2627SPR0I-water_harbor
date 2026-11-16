from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    DateTime,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.report import IssueReport


class WaterPoint(Base):
    __tablename__ = "water_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships - preserve historical reports; do not delete old reports
    reports: Mapped[List["IssueReport"]] = relationship(
        "IssueReport",
        back_populates="water_point",
        order_by="desc(IssueReport.reported_at)",
    )
