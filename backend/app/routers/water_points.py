from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.security import get_optional_staff_session, require_staff_session_with_csrf
from app.db.session import get_db
from app.models.staff_account import StaffAccount
from app.models.water_point import WaterPointType
from app.schemas.campus_location import OptionItem
from app.schemas.water_point import WaterPointCreate, WaterPointResponse, WaterPointUpdate
from app.services.water_point_service import water_point_service

router = APIRouter(prefix="/water-points", tags=["Water Points"])

WATER_POINT_TYPE_LABELS = {
    WaterPointType.WATER_COOLER.value: "Water Cooler",
    WaterPointType.BOTTLE_FILLER.value: "Bottle Filler",
    WaterPointType.DRINKING_FOUNTAIN.value: "Drinking Fountain",
    WaterPointType.PURIFIER.value: "Purifier",
    WaterPointType.DISPENSER.value: "Dispenser",
    WaterPointType.TAP.value: "Tap",
    WaterPointType.OTHER.value: "Other",
}


@router.get("/types", response_model=List[OptionItem])
def list_water_point_types():
    """Return supported water-point category options."""
    return [OptionItem(value=k, label=v) for k, v in WATER_POINT_TYPE_LABELS.items()]


@router.get("", response_model=List[WaterPointResponse])
def list_water_points(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    include_inactive: bool = Query(False, description="Include deactivated water points (staff only)"),
    campus_location_id: Optional[int] = Query(
        None, gt=0, description="Filter by campus location node (includes descendants)"
    ),
    water_point_type: Optional[str] = Query(
        None, alias="type", description="Filter by water-point category/type"
    ),
    staff: Optional[StaffAccount] = Depends(get_optional_staff_session),
    db: Session = Depends(get_db),
):
    """List campus water points. Inactive records are visible only to authenticated staff."""
    return water_point_service.list_water_points(
        db,
        skip=skip,
        limit=limit,
        include_inactive=bool(include_inactive and staff is not None),
        campus_location_id=campus_location_id,
        water_point_type=water_point_type,
    )


@router.post("", response_model=WaterPointResponse, status_code=status.HTTP_201_CREATED)
def create_water_point(
    water_point_in: WaterPointCreate,
    _staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """Create a new campus water point (authenticated staff session + CSRF required)."""
    return water_point_service.create_water_point(db, water_point_in)


@router.get("/{id}", response_model=WaterPointResponse)
def get_water_point(
    id: int,
    staff: Optional[StaffAccount] = Depends(get_optional_staff_session),
    db: Session = Depends(get_db),
):
    """Retrieve details of a single campus water point by ID."""
    return water_point_service.get_water_point_or_404(
        db, water_point_id=id, include_inactive=staff is not None
    )


@router.patch("/{id}", response_model=WaterPointResponse)
def update_water_point(
    id: int,
    water_point_in: WaterPointUpdate,
    _staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """Edit or activate/deactivate a campus water point (staff session + CSRF required)."""
    return water_point_service.update_water_point(db, water_point_id=id, data=water_point_in)
