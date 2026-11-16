from datetime import datetime
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
