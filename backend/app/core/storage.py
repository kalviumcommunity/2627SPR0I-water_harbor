"""
Report photo storage abstraction.

- ``LocalStorageBackend``: development only. Writes to a private directory that is
  never mounted as static files; objects are only served through the API.
- ``S3StorageBackend``: production. Any S3-compatible persistent object store
  (Cloudflare R2, AWS S3, Backblaze B2, ...). The bucket must remain private;
  the API proxies authorised reads.

Storage keys are always generated server-side (random UUID + extension derived
from the verified image format). User-supplied filenames are never used.
"""
import os
import re
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Optional, Protocol

from app.core.config import settings

_KEY_PATTERN = re.compile(r"^[a-z0-9\-/]{1,200}\.(jpg|png|webp)$")


class StorageError(RuntimeError):
    """Raised when the storage backend fails."""


class StorageBackend(Protocol):
    def save(self, key: str, data: bytes, content_type: str) -> None: ...

    def load(self, key: str) -> bytes: ...

    def delete(self, key: str) -> None: ...


def generate_photo_key(extension: str) -> str:
    """Generate a random, unguessable storage key. Never derived from user input."""
    if extension not in ("jpg", "png", "webp"):
        raise ValueError("Unsupported photo extension")
    return f"reports/{uuid.uuid4().hex}.{extension}"


def validate_key(key: str) -> str:
    """Reject any key that is not a server-generated photo key (path traversal guard)."""
    if not key or ".." in key or key.startswith("/") or not _KEY_PATTERN.match(key):
        raise StorageError("Invalid storage key")
    return key


class LocalStorageBackend:
    """Filesystem storage for local development (not for production)."""

    def __init__(self, base_dir: str) -> None:
        self.base_dir = Path(base_dir).resolve()

    def _path_for(self, key: str) -> Path:
        validate_key(key)
        path = (self.base_dir / key).resolve()
        if self.base_dir not in path.parents:
            raise StorageError("Invalid storage key")
        return path

    def save(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path_for(key)
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        # O_EXCL guarantees we never overwrite an existing object
        fd = os.open(str(path), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)

    def load(self, key: str) -> bytes:
        path = self._path_for(key)
        try:
            return path.read_bytes()
        except FileNotFoundError as exc:
            raise StorageError("Photo not found") from exc

    def delete(self, key: str) -> None:
        path = self._path_for(key)
        try:
            path.unlink()
        except FileNotFoundError:
            pass


class S3StorageBackend:
    """S3-compatible persistent object storage (private bucket)."""

    def __init__(
        self,
        bucket: str,
        access_key_id: str,
        secret_access_key: str,
        region: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        key_prefix: str = "",
        client=None,
    ) -> None:
        self.bucket = bucket
        self.key_prefix = key_prefix or ""
        if client is not None:
            self._client = client
        else:
            import boto3  # imported lazily so local development does not require it

            self._client = boto3.client(
                "s3",
                region_name=region or None,
                endpoint_url=endpoint_url or None,
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
            )

    def _object_key(self, key: str) -> str:
        return f"{self.key_prefix}{validate_key(key)}"

    def save(self, key: str, data: bytes, content_type: str) -> None:
        try:
            self._client.put_object(
                Bucket=self.bucket,
                Key=self._object_key(key),
                Body=data,
                ContentType=content_type,
            )
        except Exception as exc:  # pragma: no cover - network dependent
            raise StorageError("Failed to store photo") from exc

    def load(self, key: str) -> bytes:
        try:
            obj = self._client.get_object(Bucket=self.bucket, Key=self._object_key(key))
            return obj["Body"].read()
        except Exception as exc:  # pragma: no cover - network dependent
            raise StorageError("Photo not found") from exc

    def delete(self, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self.bucket, Key=self._object_key(key))
        except Exception:  # pragma: no cover - best effort cleanup
            pass


@lru_cache(maxsize=1)
def _build_storage() -> StorageBackend:
    settings.validate_storage_configuration()
    if settings.STORAGE_BACKEND == "s3":
        return S3StorageBackend(
            bucket=settings.S3_BUCKET,
            access_key_id=settings.S3_ACCESS_KEY_ID,
            secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region=settings.S3_REGION,
            endpoint_url=settings.S3_ENDPOINT_URL,
            key_prefix=settings.S3_KEY_PREFIX,
        )
    return LocalStorageBackend(settings.LOCAL_STORAGE_DIR)


def get_storage() -> StorageBackend:
    """FastAPI dependency returning the configured storage backend."""
    return _build_storage()
