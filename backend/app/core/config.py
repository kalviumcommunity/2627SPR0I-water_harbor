import os
import secrets
from pathlib import Path
from typing import List, Literal, Optional
from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Automatically locate and load .env file if present
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus WaterPoint Board"
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "waterpoint_db"

    # Staff Session & CSRF Configuration
    # Ephemeral CSPRNG fallback prevents a hardcoded static signing secret in source code.
    SESSION_SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    STAFF_SESSION_EXPIRE_MINUTES: int = 60
    STAFF_SESSION_COOKIE_NAME: str = "wh_staff_session"
    CSRF_COOKIE_NAME: str = "wh_csrf_token"
    SESSION_COOKIE_SECURE: Optional[bool] = None
    SESSION_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

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

    @field_validator("SESSION_SECRET_KEY", mode="before")
    @classmethod
    def ensure_non_empty_session_secret(cls, v: Optional[str]) -> str:
        if v and isinstance(v, str) and v.strip():
            return v.strip()
        return secrets.token_urlsafe(48)

    @property
    def session_secret(self) -> str:
        """
        Return the signing key for staff session tokens.
        Prefers explicit SESSION_SECRET_KEY, then legacy JWT_SECRET_KEY if set,
        otherwise the process-generated ephemeral secret.
        """
        if os.getenv("SESSION_SECRET_KEY"):
            return self.SESSION_SECRET_KEY
        if self.JWT_SECRET_KEY:
            return self.JWT_SECRET_KEY
        return self.SESSION_SECRET_KEY

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
