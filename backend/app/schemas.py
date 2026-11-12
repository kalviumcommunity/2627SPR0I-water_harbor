from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class WaterPointBase(BaseModel):
    name: str = Field(..., description="Water point name")
    location: str = Field(..., description="Campus location or description")

    @field_validator("name", "location")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if v is None or not isinstance(v, str):
            raise ValueError("Field is required and must be a string")
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Field cannot be empty or contain only whitespace")
        return trimmed


class WaterPointCreate(WaterPointBase):
    pass


class WaterPointResponse(WaterPointBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IssueReportCreate(BaseModel):
    water_point_id: int = Field(..., gt=0, description="Foreign key ID of the water point")
    description: str = Field(..., description="Student description of the issue")

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if v is None or not isinstance(v, str):
            raise ValueError("Description is required and must be a string")
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Description cannot be empty or contain only whitespace")
        if len(trimmed) > 500:
            raise ValueError("Description cannot exceed 500 characters")
        return trimmed


class IssueReportResponse(BaseModel):
    id: int
    water_point_id: int
    description: str
    status: str
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

