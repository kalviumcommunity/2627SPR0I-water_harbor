from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.campus_location import CampusLocation, CampusLocationType
from app.models.water_point import WaterPoint
from app.schemas.water_point import WaterPointCreate, WaterPointUpdate
from app.repositories.water_point_repository import water_point_repo
from app.services.campus_location_service import campus_location_service

_BUILDING_LIKE_TYPES = (
    CampusLocationType.BUILDING.value,
    CampusLocationType.FACILITY.value,
    CampusLocationType.BLOCK.value,
)


class WaterPointService:
    # ── Enrichment ─────────────────────────────────────────────────────────
    def attach_location_paths(self, db: Session, water_points: List[WaterPoint]) -> List[WaterPoint]:
        """Attach a transient ``location_path`` attribute for API serialisation."""
        lookup = campus_location_service.build_path_lookup(db) if water_points else {}
        for wp in water_points:
            wp.location_path = lookup.get(wp.campus_location_id, []) if wp.campus_location_id else []
        return water_points

    def _derive_building(self, db: Session, campus_location_id: Optional[int]) -> Optional[str]:
        """Nearest building/facility/block ancestor name (legacy `building` compatibility)."""
        if not campus_location_id:
            return None
        path = campus_location_service.build_path_lookup(db).get(campus_location_id, [])
        for item in reversed(path):
            if item["location_type"] in _BUILDING_LIKE_TYPES:
                return item["name"][:100]
        return None

    def _validate_campus_location(self, db: Session, campus_location_id: Optional[int]) -> None:
        if campus_location_id is None:
            return
        location = db.query(CampusLocation).filter(CampusLocation.id == campus_location_id).first()
        if not location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Campus location with id {campus_location_id} does not exist.",
            )
        if not location.is_active or not campus_location_service.is_location_effectively_active(
            db, campus_location_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected campus location or its parent hierarchy is inactive.",
            )

    # ── Queries ────────────────────────────────────────────────────────────
    def list_water_points(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
        campus_location_id: Optional[int] = None,
        water_point_type: Optional[str] = None,
    ) -> List[WaterPoint]:
        active_ids = None if include_inactive else campus_location_service.active_location_ids(db)
        location_ids = None
        if campus_location_id is not None:
            location_ids = list(
                campus_location_service.descendant_ids(
                    db, campus_location_id, active_only=not include_inactive
                )
            )
            if not location_ids:
                return []
        points = water_point_repo.get_all(
            db,
            skip=skip,
            limit=limit,
            include_inactive=include_inactive,
            campus_location_ids=location_ids,
            active_location_ids=active_ids,
            water_point_type=water_point_type,
        )
        return self.attach_location_paths(db, points)

    def get_water_point_or_404(
        self, db: Session, water_point_id: int, include_inactive: bool = False
    ) -> WaterPoint:
        water_point = water_point_repo.get_by_id(db, water_point_id=water_point_id)
        is_effectively_active = bool(
            water_point
            and water_point.is_active
            and campus_location_service.is_location_effectively_active(
                db, water_point.campus_location_id
            )
        )
        if not water_point or (not include_inactive and not is_effectively_active):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Water point with id {water_point_id} not found",
            )
        self.attach_location_paths(db, [water_point])
        return water_point

    # ── Mutations ──────────────────────────────────────────────────────────
    def create_water_point(
        self, db: Session, water_point_in: WaterPointCreate
    ) -> WaterPoint:
        self._validate_campus_location(db, water_point_in.campus_location_id)
        if water_point_in.campus_location_id is not None:
            building = self._derive_building(db, water_point_in.campus_location_id)
            wp = water_point_repo.create(
                db, water_point_in, building=building, override_building=True
            )
        else:
            wp = water_point_repo.create(
                db, water_point_in, building=water_point_in.building, override_building=True
            )
        self.attach_location_paths(db, [wp])
        return wp

    def update_water_point(
        self, db: Session, water_point_id: int, data: WaterPointUpdate
    ) -> WaterPoint:
        wp = water_point_repo.get_by_id(db, water_point_id)
        if not wp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Water point with id {water_point_id} not found",
            )
        fields = data.model_fields_set
        if "name" in fields and data.name is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty.")
        if "location" in fields and data.location is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Location cannot be empty.")

        location_changed = (
            "campus_location_id" in fields and data.campus_location_id != wp.campus_location_id
        )
        if location_changed:
            self._validate_campus_location(db, data.campus_location_id)
            wp.campus_location_id = data.campus_location_id
            if data.campus_location_id is not None:
                wp.building = self._derive_building(db, data.campus_location_id)
            else:
                wp.building = data.building if "building" in fields else None
        elif "campus_location_id" in fields and data.campus_location_id is not None:
            wp.building = self._derive_building(db, data.campus_location_id)
        elif "building" in fields:
            wp.building = self._derive_building(db, wp.campus_location_id) if wp.campus_location_id else data.building

        if "name" in fields:
            wp.name = data.name
        if "location" in fields:
            wp.location = data.location
        if "type" in fields:
            wp.type = data.type
        if "is_active" in fields and data.is_active is not None:
            if data.is_active and wp.campus_location_id:
                self._validate_campus_location(db, wp.campus_location_id)
            wp.is_active = data.is_active

        db.commit()
        db.refresh(wp)
        self.attach_location_paths(db, [wp])
        return wp


water_point_service = WaterPointService()
