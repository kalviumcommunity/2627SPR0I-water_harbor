from typing import List, Optional, Set
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.water_point import WaterPoint
from app.schemas.water_point import WaterPointCreate


class WaterPointRepository:
    def get_by_id(self, db: Session, water_point_id: int) -> Optional[WaterPoint]:
        """Retrieve a single water point by ID."""
        return db.query(WaterPoint).filter(WaterPoint.id == water_point_id).first()

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
        campus_location_ids: Optional[List[int]] = None,
        active_location_ids: Optional[Set[int]] = None,
        water_point_type: Optional[str] = None,
    ) -> List[WaterPoint]:
        """List water points with pagination and optional filters."""
        query = db.query(WaterPoint)
        if not include_inactive:
            query = query.filter(WaterPoint.is_active.is_(True))
            if active_location_ids is not None:
                if active_location_ids:
                    query = query.filter(
                        or_(
                            WaterPoint.campus_location_id.is_(None),
                            WaterPoint.campus_location_id.in_(active_location_ids),
                        )
                    )
                else:
                    query = query.filter(WaterPoint.campus_location_id.is_(None))
        if campus_location_ids is not None:
            if not campus_location_ids:
                return []
            query = query.filter(WaterPoint.campus_location_id.in_(campus_location_ids))
        if water_point_type:
            query = query.filter(WaterPoint.type == water_point_type)
        return query.order_by(WaterPoint.id.asc()).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        water_point_in: WaterPointCreate,
        building: Optional[str] = None,
        override_building: bool = False,
    ) -> WaterPoint:
        """Create a new campus water point."""
        resolved_building = building if override_building else (
            building if building is not None else water_point_in.building
        )
        db_obj = WaterPoint(
            name=water_point_in.name,
            location=water_point_in.location,
            building=resolved_building,
            type=water_point_in.type,
            campus_location_id=water_point_in.campus_location_id,
            is_active=True,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


water_point_repo = WaterPointRepository()
