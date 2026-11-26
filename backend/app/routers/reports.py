from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.datastructures import FormData, UploadFile as StarletteUploadFile
from app.core.config import settings
from sqlalchemy.orm import Session
from app.core.participant import (
    get_or_issue_participant,
    hash_participant_token,
    read_participant_hash,
    set_participant_cookie,
)
from app.core.photos import validate_and_process_upload
from app.core.rate_limit import enforce_confirmation_rate_limit, enforce_report_rate_limit
from app.core.security import (
    require_staff_session,
    require_staff_session_with_csrf,
    verify_anonymous_mutation_origin,
)
from app.core.storage import StorageBackend, StorageError, generate_photo_key, get_storage
from app.db.session import get_db
from app.models.staff_account import StaffAccount
from app.repositories.report_repository import report_repo
from app.schemas.report import (
    ConfirmationResponse,
    IssueReportCreate,
    IssueReportResolve,
    MyConfirmationsResponse,
    PublicIssueReportResponse,
    StaffIssueReportResponse,
)
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Issue Reports"])


async def _read_bounded_body(request: Request, max_bytes: int) -> bytes:
    """
    Stream the incoming request body and enforce ``max_bytes`` on actual received
    bytes (even when Content-Length is missing or inaccurate) before multipart
    parsing or JSON decoding.
    """
    raw_cl = request.headers.get("content-length")
    if raw_cl is not None:
        try:
            if int(raw_cl) > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Report request body exceeds the maximum allowed size.",
                )
        except ValueError:
            pass

    buffer = bytearray()
    async for chunk in request.stream():
        if not chunk:
            continue
        buffer.extend(chunk)
        if len(buffer) > max_bytes:
            del buffer
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Report request body exceeds the maximum allowed size.",
            )
    body = bytes(buffer)
    request._body = body
    return body


async def _parse_report_submission(
    request: Request,
) -> tuple[IssueReportCreate, Optional[UploadFile], Optional[FormData]]:
    """
    Accept either `application/json` (backward-compatible) or `multipart/form-data`
    with an optional `photo` file, enforcing a strict total body size limit.
    """
    await _read_bounded_body(request, settings.REPORT_MAX_BODY_BYTES)

    content_type = (request.headers.get("content-type") or "").lower()
    photo: Optional[UploadFile] = None
    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        raw_wp_id = form.get("water_point_id")
        raw_desc = form.get("description")
        maybe_photo = form.get("photo")
        if isinstance(maybe_photo, (UploadFile, StarletteUploadFile)) and maybe_photo.filename:
            photo = maybe_photo
        try:
            payload = IssueReportCreate(water_point_id=raw_wp_id, description=raw_desc)
        except ValidationError as exc:
            await form.close()
            raise RequestValidationError(exc.errors())
        return payload, photo, form

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid JSON request body.",
        )
    try:
        payload = IssueReportCreate.model_validate(body)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors())
    return payload, None, None


@router.post(
    "",
    response_model=PublicIssueReportResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(enforce_report_rate_limit)],
)
async def submit_report(
    request: Request,
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
):
    """
    Submit an unavailable dispenser report (JSON or multipart with optional photo).
    Students can submit reports anonymously without creating accounts.
    Protected by IP-based rate limiting and duplicate active report rules.
    """
    report_in, photo, form = await _parse_report_submission(request)

    photo_key: Optional[str] = None
    photo_content_type: Optional[str] = None
    try:
        if photo is not None:
            processed = await validate_and_process_upload(photo)
            photo_key = generate_photo_key(processed.extension)
            photo_content_type = processed.content_type
            try:
                storage.save(photo_key, processed.data, processed.content_type)
            except StorageError:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Unable to store uploaded photo at this time.",
                )

        try:
            return report_service.create_issue_report(
                db,
                report_in,
                photo_key=photo_key,
                photo_content_type=photo_content_type,
            )
        except Exception:
            if photo_key is not None:
                storage.delete(photo_key)
            raise
    finally:
        if form is not None:
            await form.close()


@router.get("/my-confirmations", response_model=MyConfirmationsResponse)
def list_my_confirmations(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Return IDs of reports confirmed by the current anonymous participant cookie.
    Does not create a cookie if none is present.
    """
    participant_hash = read_participant_hash(request)
    if not participant_hash:
        return MyConfirmationsResponse(report_ids=[])
    return MyConfirmationsResponse(
        report_ids=report_repo.get_confirmed_report_ids(db, participant_hash)
    )


@router.get("", response_model=List[PublicIssueReportResponse])
def list_reports(
    status: Optional[str] = Query(
        None,
        description="Filter reports by status (e.g. reported_unavailable, staff_confirmed_resolved)",
    ),
    water_point_id: Optional[int] = Query(
        None,
        description="Filter reports by water point ID",
    ),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    db: Session = Depends(get_db),
):
    """Retrieve public issue reports without exposing internal staff-only details."""
    return report_service.list_reports(
        db,
        status_filter=status,
        water_point_id=water_point_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{id}", response_model=PublicIssueReportResponse)
def get_report(
    id: int,
    db: Session = Depends(get_db),
):
    """Retrieve public details of an issue report by ID."""
    return report_service.get_report_or_404(db, report_id=id)


@router.get("/{id}/photo")
def get_report_photo(
    id: int,
    _staff: StaffAccount = Depends(require_staff_session),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
):
    """Serve the photo attached to an issue report (authenticated staff only)."""
    report = report_service.get_report_or_404(db, report_id=id)
    if not report.photo_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No photo is attached to this report.",
        )
    try:
        data = storage.load(report.photo_key)
    except StorageError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report photo could not be found in storage.",
        )
    return Response(
        content=data,
        media_type=report.photo_content_type or "image/jpeg",
        headers={
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store",
        },
    )


@router.post(
    "/{id}/confirm",
    response_model=ConfirmationResponse,
    dependencies=[
        Depends(verify_anonymous_mutation_origin),
        Depends(enforce_confirmation_rate_limit),
    ],
)
def confirm_report(
    id: int,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Record an anonymous "I've noticed this too" confirmation for an active report.
    Uses a random HttpOnly participant cookie (hashed server-side) to prevent
    repeated confirmations without collecting personal data or fingerprints.
    """
    token, is_new = get_or_issue_participant(request)
    participant_hash = hash_participant_token(token)
    count, _ = report_service.confirm_report(db, report_id=id, participant_hash=participant_hash)
    if is_new:
        set_participant_cookie(response, request, token)
    return ConfirmationResponse(report_id=id, confirmation_count=count, confirmed=True)


@router.post("/{id}/claim", response_model=StaffIssueReportResponse)
def claim_report(
    id: int,
    current_staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """
    Atomically claim an unassigned active issue report for the authenticated staff member.
    Returns 409 Conflict if another staff member claimed it first.
    """
    return report_service.claim_report(db, report_id=id, staff=current_staff)


@router.post("/{id}/resolve", response_model=StaffIssueReportResponse)
@router.patch("/{id}/resolve", response_model=StaffIssueReportResponse)
def resolve_report(
    id: int,
    resolve_in: Optional[IssueReportResolve] = None,
    current_staff: StaffAccount = Depends(require_staff_session_with_csrf),
    db: Session = Depends(get_db),
):
    """
    Confirm resolution of an issue report.
    Requires an authenticated staff session and CSRF token.
    Derives resolving staff identity from the authenticated StaffAccount session.
    """
    notes = resolve_in.resolution_notes if resolve_in else None

    return report_service.resolve_report(
        db,
        report_id=id,
        resolved_by=current_staff.display_name,
        resolution_notes=notes,
        resolved_by_staff_id=current_staff.id,
    )
