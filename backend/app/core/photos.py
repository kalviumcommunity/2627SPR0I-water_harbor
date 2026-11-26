"""
Validation and sanitisation of uploaded report photos.

- Enforces a byte-size limit while reading (never buffers more than limit + 1).
- Checks the declared MIME type against an allow-list.
- Enforces PHOTO_MAX_PIXELS strictly from image header dimensions BEFORE full
  decoding, without mutating Pillow's process-global Image.MAX_IMAGE_PIXELS.
- Verifies actual file content with Pillow (magic bytes + full decode) and
  requires the detected format to match the declared MIME type.
- Re-encodes the image, stripping EXIF/GPS and other metadata.
"""
import io
from dataclasses import dataclass

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import settings

ALLOWED_PHOTO_TYPES = {
    "image/jpeg": ("JPEG", "jpg"),
    "image/png": ("PNG", "png"),
    "image/webp": ("WEBP", "webp"),
}

_CHUNK_SIZE = 64 * 1024


@dataclass
class ProcessedPhoto:
    data: bytes
    content_type: str
    extension: str


def _reject(detail: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(status_code=code, detail=detail)


def _check_pixel_limit(width: int, height: int) -> None:
    if width <= 0 or height <= 0:
        raise _reject("Uploaded image has invalid dimensions.")
    if width * height > settings.PHOTO_MAX_PIXELS:
        raise _reject(
            f"Photo resolution exceeds the maximum allowed {settings.PHOTO_MAX_PIXELS} pixels."
        )


async def read_limited(upload: UploadFile, max_bytes: int) -> bytes:
    buffer = bytearray()
    while True:
        remaining = max_bytes - len(buffer)
        chunk = await upload.read(min(_CHUNK_SIZE, max(1, remaining + 1)))
        if not chunk:
            break
        if len(chunk) > remaining:
            raise _reject(
                f"Photo exceeds the maximum allowed size of {max_bytes // (1024 * 1024)} MB.",
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )
        buffer.extend(chunk)
    return bytes(buffer)


def process_photo_bytes(raw: bytes, declared_content_type: str) -> ProcessedPhoto:
    declared = (declared_content_type or "").split(";")[0].strip().lower()
    if declared not in ALLOWED_PHOTO_TYPES:
        raise _reject(
            "Unsupported photo type. Allowed formats: JPEG, PNG, WebP.",
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        )
    if not raw:
        raise _reject("Uploaded photo is empty.")

    expected_format, extension = ALLOWED_PHOTO_TYPES[declared]

    try:
        with Image.open(io.BytesIO(raw)) as probe:
            detected = probe.format
            width, height = probe.size
            _check_pixel_limit(width, height)
            if detected != expected_format:
                raise _reject("Photo content does not match its declared file type.")
            probe.verify()
    except HTTPException:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise _reject("Uploaded file is not a valid image.")

    try:
        with Image.open(io.BytesIO(raw)) as img:
            width, height = img.size
            _check_pixel_limit(width, height)
            img.load()
            img = ImageOps.exif_transpose(img)
            output = io.BytesIO()
            if expected_format == "JPEG":
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.save(output, format="JPEG", quality=85, optimize=True)
            elif expected_format == "PNG":
                img.save(output, format="PNG", optimize=True)
            else:
                img.save(output, format="WEBP", quality=85)
    except HTTPException:
        raise
    except (
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise _reject("Uploaded file is not a valid image.")

    data = output.getvalue()
    if len(data) > settings.PHOTO_MAX_BYTES:
        raise _reject(
            "Photo exceeds the maximum allowed size after processing.",
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )
    return ProcessedPhoto(data=data, content_type=declared, extension=extension)


async def validate_and_process_upload(upload: UploadFile) -> ProcessedPhoto:
    if not settings.PHOTO_UPLOADS_ENABLED:
        raise _reject("Photo uploads are currently disabled.", status.HTTP_403_FORBIDDEN)
    raw = await read_limited(upload, settings.PHOTO_MAX_BYTES)
    return process_photo_bytes(raw, upload.content_type or "")
