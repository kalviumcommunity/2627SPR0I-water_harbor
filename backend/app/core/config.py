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
        return self

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
