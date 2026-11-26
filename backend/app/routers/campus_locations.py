from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_optional_staff_session, require_staff_session_with_csrf
from app.db.session import get_db
from app.models.staff_account import StaffAccount
from app.schemas.campus_location import (
    CampusLocationCreate,
    CampusLocationResponse,
    CampusLocationUpdate,
    OptionItem,
)
from app.services.campus_location_service import (
    LOCATION_TYPE_LABELS,
    campus_location_service,
)

router = APIRouter(prefix="/campus-locations", tags=["Campus Locations"])


@router.get("/types", response_model=List[OptionItem])
def list_location_types():
    """Return supported campus hierarchy location types."""
    return [OptionItem(value=k, label=v) for k, v in LOCATION_TYPE_LABELS.items()]


@router.get("", response_model=List[CampusLocationResponse])
def list_campus_locations(
    include_inactive: bool = Query(False, description="Include deactivated locations (staff only)"),
    staff: Optional[StaffAccount] = Depends(get_optional_staff_session),
    db: Session = Depends(get_db),
):
    """List configured campus locations. Inactive records are visible only to authenticated staff."""
    return campus_location_service.list_locations(
        db, include_inactive=bool(include_inactive and staff is not None)
    )


@router.get("/{id}", response_model=CampusLocationResponse)
def get_campus_location(
    id: int,
    staff: Optional[StaffAccount] = Depends(get_optional_staff_session),
    db: Session = Depends(get_db),
):
    """Retrieve a single campus location node by ID."""
    return campus_location_service.get_or_404(
        db, location_id=id, include_inactive=staff is not None
    )


@router.post("", response_model=CampusLocationResponse, status_code=status.HTTP_201_CREATED)
def create_campus_location(
    location_in: CampusLocationCreate,
    _staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """Create a campus location node (staff session + CSRF required)."""
    return campus_location_service.create_location(db, location_in)


@router.patch("/{id}", response_model=CampusLocationResponse)
def update_campus_location(
    id: int,
    location_in: CampusLocationUpdate,
    _staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """Edit or activate/deactivate a campus location node (staff session + CSRF required)."""
    return campus_location_service.update_location(db, location_id=id, data=location_in)
