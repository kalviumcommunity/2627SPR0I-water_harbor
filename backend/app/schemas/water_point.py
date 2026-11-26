from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.water_point import WaterPointType
from app.schemas.campus_location import LocationPathItem

WATER_POINT_TYPE_VALUES = {t.value for t in WaterPointType}


def _normalize_type(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    if not isinstance(v, str):
        raise ValueError("Water point type must be a string")
    norm = v.strip().lower().replace("-", "_").replace(" ", "_")
    if not norm:
        return None
    if norm not in WATER_POINT_TYPE_VALUES:
        raise ValueError(
            "Invalid water point type. Allowed: " + ", ".join(sorted(WATER_POINT_TYPE_VALUES))
        )
    return norm


def _clean_building(v: Optional[str]) -> Optional[str]:
    if v is not None:
        trimmed = v.strip()
        return trimmed if trimmed else None
    return None


class WaterPointBase(BaseModel):
    name: str = Field(..., max_length=100, description="Water point name")
    location: str = Field(..., max_length=255, description="Campus location or description")
    building: Optional[str] = Field(None, max_length=100, description="Campus building name")
    type: Optional[str] = Field(None, description="Water point category/type")
    campus_location_id: Optional[int] = Field(
        None, gt=0, description="Structured campus location ID"
    )

    @field_validator("name", "location")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if v is None or not isinstance(v, str):
            raise ValueError("Field is required and must be a string")
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or contain only whitespace")
        return trimmed

    @field_validator("building")
    @classmethod
    def validate_building(cls, v: Optional[str]) -> Optional[str]:
        return _clean_building(v)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        return _normalize_type(v)


class WaterPointCreate(WaterPointBase):
    pass


class WaterPointUpdate(BaseModel):
    """Partial update. Only explicitly provided fields are applied."""

    name: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    building: Optional[str] = Field(None, max_length=100)
    type: Optional[str] = None
    campus_location_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

    @field_validator("name", "location")
    @classmethod
    def validate_non_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or contain only whitespace")
        return trimmed

    @field_validator("building")
    @classmethod
    def validate_building(cls, v: Optional[str]) -> Optional[str]:
        return _clean_building(v)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: Optional[str]) -> Optional[str]:
        return _normalize_type(v)


class WaterPointResponse(BaseModel):
    id: int
    name: str
    location: str
    building: Optional[str] = None
    type: Optional[str] = None
    campus_location_id: Optional[int] = None
    location_path: List[LocationPathItem] = []
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
