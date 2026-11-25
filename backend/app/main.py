from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.routers import reports, staff, water_points

app = FastAPI(title=settings.PROJECT_NAME)

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router registration
app.include_router(water_points.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(staff.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "WaterPoint Board API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    """
    Verify PostgreSQL connectivity using SQLAlchemy.
    Executes a query to ensure database engine and connection pool are healthy.
    """
    try:
        result = db.execute(text("SELECT 1")).scalar()
        if result != 1:
            raise Exception("Unexpected query result")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity check failed: {str(e)}",
        )
