from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import WaterPointCreate, WaterPointResponse
from app import crud

router = APIRouter(prefix="/water-points", tags=["Water Points"])


@router.get("", response_model=List[WaterPointResponse])
def list_water_points(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    db: Session = Depends(get_db),
):
    """
    List campus water points with optional pagination.
    """
    return crud.get_water_points(db, skip=skip, limit=limit)


@router.post("", response_model=WaterPointResponse, status_code=status.HTTP_201_CREATED)
def create_water_point(
    water_point_in: WaterPointCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new campus water point.
    """
    return crud.create_water_point(db, water_point_in)


@router.get("/{id}", response_model=WaterPointResponse)
def get_water_point(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve details of a single campus water point by ID.
    """
    water_point = crud.get_water_point(db, water_point_id=id)
    if not water_point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Water point with id {id} not found",
        )
    return water_point

