import secrets
from pathlib import Path
from typing import List, Literal, Optional
from dotenv import load_dotenv
from pydantic import PrivateAttr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Automatically locate and load .env file if present
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

MIN_PRODUCTION_SESSION_SECRET_LENGTH = 32


class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus WaterPoint Board"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "waterpoint_db"

    # Staff Session & CSRF Configuration
    # In production, SESSION_SECRET_KEY must be explicitly set (>= 32 chars).
    # In development/test, an ephemeral CSPRNG fallback is generated per process if omitted.
    SESSION_SECRET_KEY: Optional[str] = None
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    STAFF_SESSION_EXPIRE_MINUTES: int = 60
    STAFF_SESSION_COOKIE_NAME: str = "wh_staff_session"
    CSRF_COOKIE_NAME: str = "wh_csrf_token"
    SESSION_COOKIE_SECURE: Optional[bool] = None
    SESSION_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    _ephemeral_session_secret: str = PrivateAttr(
        default_factory=lambda: secrets.token_urlsafe(48)
    )

    # Anonymous Report Rate Limiting (per client IP)
    REPORT_RATE_LIMIT_ENABLED: bool = True
    REPORT_RATE_LIMIT_MAX_REQUESTS: int = 5
    REPORT_RATE_LIMIT_WINDOW_SECONDS: int = 60
    TRUSTED_PROXY_IPS: List[str] = []

    # Anonymous "I've noticed this too" confirmations (per client IP; IP is never stored)
    CONFIRMATION_RATE_LIMIT_MAX_REQUESTS: int = 20
    CONFIRMATION_RATE_LIMIT_WINDOW_SECONDS: int = 60
    PARTICIPANT_COOKIE_NAME: str = "wh_participant"
    PARTICIPANT_COOKIE_MAX_AGE_DAYS: int = 180

    # Report photo uploads
    PHOTO_UPLOADS_ENABLED: bool = True
    PHOTO_MAX_BYTES: int = 5 * 1024 * 1024
    REPORT_MAX_BODY_BYTES: int = 5 * 1024 * 1024 + 256 * 1024
    PHOTO_MAX_PIXELS: int = 40_000_000
    # Storage backend: "local" (development only) or "s3" (S3-compatible object storage,
    # e.g. Cloudflare R2 / AWS S3 / Backblaze B2). Production must use "s3".
    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    LOCAL_STORAGE_DIR: str = str(BASE_DIR / "uploads")
    S3_BUCKET: Optional[str] = None
    S3_REGION: Optional[str] = None
    S3_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None
    S3_KEY_PREFIX: str = "report-photos/"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=(".env", str(BASE_DIR / ".env")),
        extra="ignore",
    )

    @field_validator("ENVIRONMENT", mode="before")
    @classmethod
    def normalize_environment(cls, v: Optional[str]) -> str:
        if v is None or (isinstance(v, str) and not v.strip()):
            return "development"
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("SESSION_SECRET_KEY", "JWT_SECRET_KEY", mode="before")
    @classmethod
    def strip_optional_secret(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            trimmed = v.strip()
            return trimmed if trimmed else None
        return v

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if (
                not self.SESSION_SECRET_KEY
                or len(self.SESSION_SECRET_KEY) < MIN_PRODUCTION_SESSION_SECRET_LENGTH
            ):
                raise ValueError(
                    f"SESSION_SECRET_KEY must be explicitly configured in production "
                    f"and be at least {MIN_PRODUCTION_SESSION_SECRET_LENGTH} characters long."
                )
            if self.SESSION_COOKIE_SECURE is False:
                raise ValueError(
                    "SESSION_COOKIE_SECURE must be true in production."
                )
            if self.SESSION_COOKIE_SECURE is None:
                self.SESSION_COOKIE_SECURE = True
        if self.SESSION_COOKIE_SAMESITE == "none" and self.SESSION_COOKIE_SECURE is False:
            raise ValueError("SESSION_COOKIE_SAMESITE=none requires SESSION_COOKIE_SECURE=true.")
        return self

    def validate_storage_configuration(self) -> None:
        """
        Validate photo storage configuration. Called at application startup so a
        production deployment refuses to start with ephemeral/local photo storage.
        """
        if not self.PHOTO_UPLOADS_ENABLED:
            return
        if self.ENVIRONMENT == "production" and self.STORAGE_BACKEND != "s3":
            raise ValueError(
                "Production photo uploads require STORAGE_BACKEND=s3 (persistent "
                "external object storage). Local container storage is ephemeral."
            )
        if self.STORAGE_BACKEND == "s3" and (
            not self.S3_BUCKET or not self.S3_ACCESS_KEY_ID or not self.S3_SECRET_ACCESS_KEY
        ):
            raise ValueError(
                "STORAGE_BACKEND=s3 requires S3_BUCKET, S3_ACCESS_KEY_ID and "
                "S3_SECRET_ACCESS_KEY to be configured."
            )

    @property
    def session_secret(self) -> str:
        """
        Return the signing key for staff session tokens.
        In production, only explicit SESSION_SECRET_KEY is permitted.
        In development/test, falls back to legacy JWT_SECRET_KEY if set,
        otherwise uses the process-generated ephemeral secret.
        """
        if self.ENVIRONMENT == "production":
            if not self.SESSION_SECRET_KEY:
                raise ValueError("SESSION_SECRET_KEY is required in production.")
            return self.SESSION_SECRET_KEY

        if self.SESSION_SECRET_KEY:
            return self.SESSION_SECRET_KEY
        if self.JWT_SECRET_KEY:
            return self.JWT_SECRET_KEY
        return self._ephemeral_session_secret

    @property
    def sqlalchemy_database_uri(self) -> str:
        """
        Returns a valid SQLAlchemy 2.0 database URL using the psycopg3 driver.
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+psycopg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg://", 1)
            return url

        # Construct connection URI from individual parameters
        auth = self.POSTGRES_USER
        if self.POSTGRES_PASSWORD:
            auth += f":{self.POSTGRES_PASSWORD}"
        return f"postgresql+psycopg://{auth}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
