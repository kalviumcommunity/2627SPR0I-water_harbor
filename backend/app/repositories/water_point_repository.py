from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.water_point import WaterPoint
from app.schemas.water_point import WaterPointCreate


class WaterPointRepository:
    def get_by_id(self, db: Session, water_point_id: int) -> Optional[WaterPoint]:
        """Retrieve a single water point by ID."""
        return db.query(WaterPoint).filter(WaterPoint.id == water_point_id).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[WaterPoint]:
        """List water points with pagination."""
        return db.query(WaterPoint).order_by(WaterPoint.id.asc()).offset(skip).limit(limit).all()

    def create(self, db: Session, water_point_in: WaterPointCreate) -> WaterPoint:
        """Create a new campus water point."""
        db_obj = WaterPoint(
            name=water_point_in.name,
            location=water_point_in.location,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


water_point_repo = WaterPointRepository()
