from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


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


class PublicIssueReportResponse(BaseModel):
    """Publicly accessible report fields without internal staff-only metadata."""
    id: int
    water_point_id: int
    description: str
    status: str
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    confirmation_count: int = 0
    # Internal storage key: used only to expose boolean has_photo publicly
    photo_key: Optional[str] = Field(None, exclude=True)

    model_config = ConfigDict(from_attributes=True)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def has_photo(self) -> bool:
        return bool(self.photo_key)


class StaffReference(BaseModel):
    id: int
    display_name: str

    model_config = ConfigDict(from_attributes=True)


class StaffIssueReportResponse(PublicIssueReportResponse):
    """Full report representation restricted to authenticated staff sessions."""
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    assigned_staff_id: Optional[int] = None
    assigned_staff: Optional[StaffReference] = None
    assigned_at: Optional[datetime] = None
    resolved_by_staff_id: Optional[int] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def photo_url(self) -> Optional[str]:
        return f"/api/reports/{self.id}/photo" if self.photo_key else None


# Backward-compatible alias for internal/staff callers
IssueReportResponse = StaffIssueReportResponse


class IssueReportResolve(BaseModel):
    resolution_notes: Optional[str] = Field(None, max_length=300, description="Notes detailing the repair action")

    @field_validator("resolution_notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            return trimmed if trimmed else None
        return None


class ConfirmationResponse(BaseModel):
    report_id: int
    confirmation_count: int
    confirmed: bool = True


class MyConfirmationsResponse(BaseModel):
    report_ids: List[int] = []
