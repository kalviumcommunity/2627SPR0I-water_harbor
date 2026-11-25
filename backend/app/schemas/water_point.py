from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class WaterPointBase(BaseModel):
    name: str = Field(..., description="Water point name")
    location: str = Field(..., description="Campus location or description")
    building: Optional[str] = Field(None, description="Campus building name")
    type: Optional[str] = Field(None, description="Optional water point dispenser type")

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
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None


class WaterPointCreate(WaterPointBase):
    pass


class WaterPointResponse(WaterPointBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
