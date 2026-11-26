import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.campus_location import CampusLocation
    from app.models.report import IssueReport


class WaterPointType(str, enum.Enum):
    """Controlled vocabulary of water-point categories (not an inventory)."""

    WATER_COOLER = "water_cooler"
    BOTTLE_FILLER = "bottle_filler"
    DRINKING_FOUNTAIN = "drinking_fountain"
    PURIFIER = "purifier"
    DISPENSER = "dispenser"
    TAP = "tap"
    OTHER = "other"


class WaterPoint(Base):
    __tablename__ = "water_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    # Persisted water-point category (column name "type")
    type: Mapped[Optional[str]] = mapped_column("type", String(50), nullable=True, index=True)
    # Structured campus location (nullable for backward compatibility with existing rows)
    campus_location_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("campus_locations.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    campus_location: Mapped[Optional["CampusLocation"]] = relationship(
        "CampusLocation",
        back_populates="water_points",
    )

    # Relationships - preserve historical reports; do not delete old reports
    reports: Mapped[List["IssueReport"]] = relationship(
        "IssueReport",
        back_populates="water_point",
        order_by="desc(IssueReport.reported_at)",
    )
