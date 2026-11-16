from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.water_point import WaterPoint
from app.schemas.water_point import WaterPointCreate
from app.repositories.water_point_repository import water_point_repo


class WaterPointService:
    def list_water_points(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> List[WaterPoint]:
        return water_point_repo.get_all(db, skip=skip, limit=limit)

    def get_water_point_or_404(
        self, db: Session, water_point_id: int
    ) -> WaterPoint:
        water_point = water_point_repo.get_by_id(db, water_point_id=water_point_id)
        if not water_point:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Water point with id {water_point_id} not found",
            )
        return water_point

    def create_water_point(
        self, db: Session, water_point_in: WaterPointCreate
    ) -> WaterPoint:
        return water_point_repo.create(db, water_point_in)


water_point_service = WaterPointService()
