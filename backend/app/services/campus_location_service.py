from typing import Dict, List, Optional, Set

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.campus_location import (
    ALLOWED_PARENT_TYPES,
    CampusLocation,
    CampusLocationType,
)
from app.models.water_point import WaterPoint
from app.schemas.campus_location import CampusLocationCreate, CampusLocationUpdate

LOCATION_TYPE_LABELS = {
    CampusLocationType.CAMPUS.value: "Campus",
    CampusLocationType.BLOCK.value: "Block",
    CampusLocationType.BUILDING.value: "Building",
    CampusLocationType.FACILITY.value: "Facility",
    CampusLocationType.FLOOR.value: "Floor",
    CampusLocationType.INDOOR_AREA.value: "Indoor area",
    CampusLocationType.OUTDOOR_AREA.value: "Outdoor area",
}


class CampusLocationService:
    # ── Queries ────────────────────────────────────────────────────────────
    def active_location_ids(self, db: Session) -> Set[int]:
        """
        Return IDs of locations that are active AND have only active ancestors.
        A child beneath an inactive parent/ancestor is treated as inactive.
        """
        rows = db.query(
            CampusLocation.id,
            CampusLocation.parent_id,
            CampusLocation.is_active,
        ).all()
        active_children: Dict[Optional[int], List[int]] = {}
        for r in rows:
            if r.is_active:
                active_children.setdefault(r.parent_id, []).append(r.id)

        result: Set[int] = set()
        stack = list(active_children.get(None, []))
        while stack:
            current = stack.pop()
            if current in result:
                continue
            result.add(current)
            stack.extend(active_children.get(current, []))
        return result

    def is_location_effectively_active(self, db: Session, location_id: Optional[int]) -> bool:
        if location_id is None:
            return True
        return location_id in self.active_location_ids(db)

    def list_locations(self, db: Session, include_inactive: bool = False) -> List[CampusLocation]:
        query = db.query(CampusLocation)
        if not include_inactive:
            active_ids = self.active_location_ids(db)
            if not active_ids:
                return []
            query = query.filter(CampusLocation.id.in_(active_ids))
        return query.order_by(
            CampusLocation.display_order.asc(),
            CampusLocation.name.asc(),
            CampusLocation.id.asc(),
        ).all()

    def get_or_404(
        self, db: Session, location_id: int, include_inactive: bool = True
    ) -> CampusLocation:
        location = db.query(CampusLocation).filter(CampusLocation.id == location_id).first()
        if not location or (
            not include_inactive and not self.is_location_effectively_active(db, location.id)
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Campus location with id {location_id} not found",
            )
        return location

    def build_path_lookup(self, db: Session) -> Dict[int, List[dict]]:
        """Return {location_id: [root, ..., node]} path items for all locations."""
        rows = db.query(
            CampusLocation.id,
            CampusLocation.parent_id,
            CampusLocation.name,
            CampusLocation.location_type,
        ).all()
        by_id = {r.id: r for r in rows}
        cache: Dict[int, List[dict]] = {}

        def path_for(loc_id: int, guard: Optional[Set[int]] = None) -> List[dict]:
            if loc_id in cache:
                return cache[loc_id]
            guard = guard or set()
            row = by_id.get(loc_id)
            if row is None or loc_id in guard:
                return []
            guard.add(loc_id)
            parent_path = path_for(row.parent_id, guard) if row.parent_id else []
            result = parent_path + [
                {"id": row.id, "name": row.name, "location_type": row.location_type}
            ]
            cache[loc_id] = result
            return result

        for loc_id in by_id:
            path_for(loc_id)
        return cache

    def descendant_ids(
        self, db: Session, location_id: int, active_only: bool = False
    ) -> Set[int]:
        """Return the location ID plus all descendant IDs."""
        if active_only and not self.is_location_effectively_active(db, location_id):
            return set()
        rows = db.query(
            CampusLocation.id,
            CampusLocation.parent_id,
            CampusLocation.is_active,
        ).all()
        children: Dict[int, List[int]] = {}
        for r in rows:
            if active_only and not r.is_active:
                continue
            if r.parent_id is not None:
                children.setdefault(r.parent_id, []).append(r.id)
        result: Set[int] = set()
        stack = [location_id]
        while stack:
            current = stack.pop()
            if current in result:
                continue
            result.add(current)
            stack.extend(children.get(current, []))
        return result

    # ── Validation helpers ─────────────────────────────────────────────────
    def _validate_parent(
        self,
        db: Session,
        location_type: str,
        parent_id: Optional[int],
        self_id: Optional[int] = None,
        require_active_parent: bool = True,
    ) -> None:
        loc_type = CampusLocationType(location_type)
        allowed = ALLOWED_PARENT_TYPES[loc_type]
        if parent_id is None:
            if None not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A {LOCATION_TYPE_LABELS[loc_type.value].lower()} must have a parent location.",
                )
            return

        if self_id is not None and parent_id == self_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A location cannot be its own parent.",
            )

        parent = db.query(CampusLocation).filter(CampusLocation.id == parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent location with id {parent_id} does not exist.",
            )
        if require_active_parent and not parent.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent location is inactive.",
            )
        parent_type = CampusLocationType(parent.location_type)
        if parent_type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"A {LOCATION_TYPE_LABELS[loc_type.value].lower()} cannot be placed under a "
                    f"{LOCATION_TYPE_LABELS[parent_type.value].lower()}."
                ),
            )
        if self_id is not None and parent_id in self.descendant_ids(db, self_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A location cannot be moved beneath one of its own descendants.",
            )

    def _commit_or_conflict(self, db: Session) -> None:
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A location with this name already exists under the selected parent.",
            )

    # ── Mutations ──────────────────────────────────────────────────────────
    def create_location(self, db: Session, data: CampusLocationCreate) -> CampusLocation:
        self._validate_parent(db, data.location_type.value, data.parent_id)
        location = CampusLocation(
            parent_id=data.parent_id,
            location_type=data.location_type.value,
            name=data.name,
            code=data.code,
            description=data.description,
            display_order=data.display_order,
            is_active=data.is_active,
        )
        db.add(location)
        self._commit_or_conflict(db)
        db.refresh(location)
        return location

    def update_location(
        self, db: Session, location_id: int, data: CampusLocationUpdate
    ) -> CampusLocation:
        location = self.get_or_404(db, location_id)
        fields = data.model_fields_set

        new_type = data.location_type.value if "location_type" in fields and data.location_type else location.location_type
        new_parent = data.parent_id if "parent_id" in fields else location.parent_id

        if "location_type" in fields or "parent_id" in fields:
            self._validate_parent(
                db,
                new_type,
                new_parent,
                self_id=location.id,
                require_active_parent=("parent_id" in fields and new_parent != location.parent_id),
            )
            if new_type != location.location_type:
                # Existing children must remain valid under the new type
                child_types = {
                    c.location_type
                    for c in db.query(CampusLocation).filter(CampusLocation.parent_id == location.id)
                }
                for child_type in child_types:
                    if CampusLocationType(new_type) not in ALLOWED_PARENT_TYPES[CampusLocationType(child_type)]:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Changing the type would invalidate existing child locations.",
                        )

        if "is_active" in fields and data.is_active is False and location.is_active:
            active_children = (
                db.query(CampusLocation)
                .filter(CampusLocation.parent_id == location.id, CampusLocation.is_active.is_(True))
                .count()
            )
            active_points = (
                db.query(WaterPoint)
                .filter(WaterPoint.campus_location_id == location.id, WaterPoint.is_active.is_(True))
                .count()
            )
            if active_children or active_points:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Deactivate or move the active child locations and water points "
                        "assigned to this location first."
                    ),
                )
        if "is_active" in fields and data.is_active is True and not location.is_active and location.parent_id:
            parent = db.query(CampusLocation).filter(CampusLocation.id == location.parent_id).first()
            if parent and not parent.is_active and new_parent == location.parent_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Activate the parent location first.",
                )

        if "name" in fields and data.name is not None:
            location.name = data.name
        if "location_type" in fields and data.location_type is not None:
            location.location_type = data.location_type.value
        if "parent_id" in fields:
            location.parent_id = data.parent_id
        if "code" in fields:
            location.code = data.code
        if "description" in fields:
            location.description = data.description
        if "display_order" in fields and data.display_order is not None:
            location.display_order = data.display_order
        if "is_active" in fields and data.is_active is not None:
            location.is_active = data.is_active

        if any(k in fields for k in ("name", "location_type", "parent_id")):
            db.flush()
            self._sync_descendant_water_point_buildings(db, location.id)

        self._commit_or_conflict(db)
        db.refresh(location)
        return location

    def _sync_descendant_water_point_buildings(self, db: Session, location_id: int) -> None:
        """
        Recalculate the legacy ``building`` field on all water points beneath
        ``location_id`` within the current transaction so renaming, retyping, or
        reparenting a campus location never leaves stale building labels.
        """
        desc_ids = self.descendant_ids(db, location_id)
        if not desc_ids:
            return
        affected_points = (
            db.query(WaterPoint).filter(WaterPoint.campus_location_id.in_(desc_ids)).all()
        )
        if not affected_points:
            return
        building_types = (
            CampusLocationType.BUILDING.value,
            CampusLocationType.FACILITY.value,
            CampusLocationType.BLOCK.value,
        )
        lookup = self.build_path_lookup(db)
        for wp in affected_points:
            path = lookup.get(wp.campus_location_id, [])
            derived = None
            for item in reversed(path):
                if item["location_type"] in building_types:
                    derived = item["name"][:100]
                    break
            wp.building = derived


campus_location_service = CampusLocationService()
