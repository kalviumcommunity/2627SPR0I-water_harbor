from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.campus_location import CampusLocationType


def _clean_optional(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    if not isinstance(v, str):
        raise ValueError("Must be a string")
    trimmed = v.strip()
    return trimmed or None


class CampusLocationCreate(BaseModel):
    name: str = Field(..., max_length=100, description="Location name")
    location_type: CampusLocationType = Field(..., description="Hierarchy node type")
    parent_id: Optional[int] = Field(None, gt=0, description="Parent location ID")
    code: Optional[str] = Field(None, max_length=50, description="Optional short code")
    description: Optional[str] = Field(None, max_length=255)
    display_order: int = Field(0, ge=0, le=100000)
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if v is None or not isinstance(v, str) or not v.strip():
            raise ValueError("Name cannot be empty or contain only whitespace")
        return v.strip()

    @field_validator("code", "description")
    @classmethod
    def validate_optional(cls, v: Optional[str]) -> Optional[str]:
        return _clean_optional(v)


class CampusLocationUpdate(BaseModel):
    """Partial update. Only fields explicitly provided are applied."""

    name: Optional[str] = Field(None, max_length=100)
    location_type: Optional[CampusLocationType] = None
    parent_id: Optional[int] = Field(None, gt=0)
    code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    display_order: Optional[int] = Field(None, ge=0, le=100000)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            raise ValueError("Name cannot be empty or contain only whitespace")
        return v.strip()

    @field_validator("code", "description")
    @classmethod
    def validate_optional(cls, v: Optional[str]) -> Optional[str]:
        return _clean_optional(v)


class CampusLocationResponse(BaseModel):
    id: int
    parent_id: Optional[int] = None
    location_type: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LocationPathItem(BaseModel):
    id: int
    name: str
    location_type: str

    model_config = ConfigDict(from_attributes=True)


class OptionItem(BaseModel):
    value: str
    label: str


CampusLocationList = List[CampusLocationResponse]
