from app.schemas.campus_location import (
    CampusLocationCreate,
    CampusLocationResponse,
    CampusLocationUpdate,
    LocationPathItem,
    OptionItem,
)
from app.schemas.water_point import (
    WaterPointBase,
    WaterPointCreate,
    WaterPointResponse,
    WaterPointUpdate,
)
from app.schemas.report import (
    ConfirmationResponse,
    IssueReportCreate,
    IssueReportResponse,
    MyConfirmationsResponse,
    PublicIssueReportResponse,
    StaffIssueReportResponse,
)
from app.schemas.staff import (
    StaffAccountPublic,
    StaffLoginRequest,
    StaffLogoutResponse,
    StaffSessionResponse,
)

__all__ = [
    "CampusLocationCreate",
    "CampusLocationResponse",
    "CampusLocationUpdate",
    "LocationPathItem",
    "OptionItem",
    "WaterPointBase",
    "WaterPointCreate",
    "WaterPointResponse",
    "WaterPointUpdate",
    "ConfirmationResponse",
    "IssueReportCreate",
    "IssueReportResponse",
    "MyConfirmationsResponse",
    "PublicIssueReportResponse",
    "StaffIssueReportResponse",
    "StaffAccountPublic",
    "StaffLoginRequest",
    "StaffLogoutResponse",
    "StaffSessionResponse",
]
