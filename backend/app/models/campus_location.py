import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func as sa_func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.water_point import WaterPoint


class CampusLocationType(str, enum.Enum):
    """Supported node types within the campus location hierarchy."""

    CAMPUS = "campus"
    BLOCK = "block"
    BUILDING = "building"
    FACILITY = "facility"
    FLOOR = "floor"
    INDOOR_AREA = "indoor_area"
    OUTDOOR_AREA = "outdoor_area"


# Allowed parent types for each location type. ``None`` means the node may be a root.
# Standalone facilities/buildings may sit directly under a campus (or be a root) without
# belonging to a numbered block.
ALLOWED_PARENT_TYPES = {
    CampusLocationType.CAMPUS: {None},
    CampusLocationType.BLOCK: {None, CampusLocationType.CAMPUS},
    CampusLocationType.BUILDING: {None, CampusLocationType.CAMPUS, CampusLocationType.BLOCK},
    CampusLocationType.FACILITY: {None, CampusLocationType.CAMPUS, CampusLocationType.BLOCK},
    CampusLocationType.FLOOR: {
        CampusLocationType.BLOCK,
        CampusLocationType.BUILDING,
        CampusLocationType.FACILITY,
    },
    CampusLocationType.INDOOR_AREA: {
        CampusLocationType.BLOCK,
        CampusLocationType.BUILDING,
        CampusLocationType.FACILITY,
        CampusLocationType.FLOOR,
    },
    CampusLocationType.OUTDOOR_AREA: {
        None,
        CampusLocationType.CAMPUS,
        CampusLocationType.BLOCK,
        CampusLocationType.BUILDING,
        CampusLocationType.FACILITY,
    },
}


class CampusLocation(Base):
    """
    Hierarchical, database-backed campus location node (campus, block, floor,
    building/facility, indoor area or outdoor area). Records are configured by
    staff through the management workflow; none are seeded by the application.
    """

    __tablename__ = "campus_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("campus_locations.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    location_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
        index=True,
    )
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
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

    parent: Mapped[Optional["CampusLocation"]] = relationship(
        "CampusLocation",
        remote_side="CampusLocation.id",
        back_populates="children",
    )
    children: Mapped[List["CampusLocation"]] = relationship(
        "CampusLocation",
        back_populates="parent",
    )
    water_points: Mapped[List["WaterPoint"]] = relationship(
        "WaterPoint",
        back_populates="campus_location",
    )

    __table_args__ = (
        # Sibling names must be unique (case-insensitive) under the same parent.
        Index(
            "uq_campus_location_sibling_name",
            sa_func.coalesce(parent_id, 0),
            sa_func.lower(name),
            unique=True,
        ),
    )
