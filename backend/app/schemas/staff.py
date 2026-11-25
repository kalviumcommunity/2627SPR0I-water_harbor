from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class StaffLoginRequest(BaseModel):
    access_key: str = Field(..., min_length=1, max_length=256, description="Staff access key")

    @field_validator("access_key")
    @classmethod
    def validate_access_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Access key is required")
        return v


class StaffAccountPublic(BaseModel):
    id: int
    identifier: str
    display_name: str

    model_config = ConfigDict(from_attributes=True)


class StaffSessionResponse(BaseModel):
    authenticated: bool = True
    staff: StaffAccountPublic
    csrf_token: str
    expires_at: datetime


class StaffLogoutResponse(BaseModel):
    message: str
