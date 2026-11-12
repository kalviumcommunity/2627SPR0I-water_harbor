# Campus WaterPoint Board – Backend Setup & Guide

**Sprint:** 2627SPR0I | **Campus:** CHR | **Squad:** 62 | **Team:** 03  
**Stack:** Python 3.12+, FastAPI, SQLAlchemy 2.0, PostgreSQL 17, psycopg 3, Alembic, pytest

---

## 1. Python Virtual Environment Setup

Create and activate a virtual environment within the `backend/` directory:

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment:
# macOS / Linux:
source venv/bin/activate
# Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
# Windows (Git Bash):
# source venv/Scripts/activate
```

---

## 2. Dependency Installation

Install all required dependencies using `pip`:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Core dependencies installed:
- `fastapi` & `uvicorn`: High-performance ASGI framework and server
- `SQLAlchemy` (2.0.36): Modern Python SQL toolkit and ORM
- `psycopg` (3.2.9) & `psycopg-binary`: PostgreSQL database adapter for Python
- `alembic` (1.15.2): Database schema migration tool
- `pydantic` (2.11.4) & `pydantic-settings`: Data validation and environment settings management
- `pytest` & `httpx`: Automated testing suite and HTTP test client

---

## 3. PostgreSQL Database Configuration

Ensure PostgreSQL (v17 or compatible) is installed and running locally:

```bash
# Verify PostgreSQL is running
psql -U <your_postgres_user> -c '\conninfo'

# Create the application database if it does not already exist:
psql -U <your_postgres_user> -c "CREATE DATABASE waterpoint_db;"
```

---

## 4. Environment Variable Setup

Copy the example environment configuration into `.env`:

```bash
cp .env.example .env
```

Edit `.env` to match your local PostgreSQL credentials:

```ini
# PostgreSQL Database Connection URL
# Format: postgresql+psycopg://<username>:<password>@<host>:<port>/<dbname>
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_db

# Fallback individual parameters (used if DATABASE_URL is omitted)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=waterpoint_db

# Security & Authentication (reserved for future staff sprint features)
JWT_SECRET_KEY=change-this-in-production-to-a-secure-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
```

> **Security Note:** `.env` is ignored by Git and should never be committed to source control.

---

## 5. Running Alembic Database Migrations

Apply the database migrations to create the required tables, foreign keys, and indexes:

```bash
# Run migrations up to the latest revision
alembic upgrade head
```

To verify the migration status:

```bash
alembic current
```

---

## 6. Starting FastAPI Server

Start the local development server with auto-reload:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be reachable at `http://localhost:8000`.

---

## 7. Interactive API Documentation (Swagger / OpenAPI)

Once the backend is running, open your browser to:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Implemented Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status message |
| `GET` | `/health` | Application health check |
| `GET` | `/health/db` | Live PostgreSQL connectivity check via SQLAlchemy |
| `GET` | `/api/water-points` | List campus water points (supports `skip` & `limit`) |
| `POST` | `/api/water-points` | Register a new water point |
| `GET` | `/api/water-points/{id}` | Retrieve water point details by ID |
| `POST` | `/api/reports` | Submit an unavailable dispenser report (no login required) |
| `GET` | `/api/reports` | List reports (optional `status` and `water_point_id` filters) |
| `GET` | `/api/reports/{id}` | Retrieve report details by ID |

---

## 8. Running Automated Tests

Run the full pytest suite:

```bash
pytest -v
```

All 25 automated tests verify:
- Database connectivity (`/health/db` and direct SQLAlchemy queries)
- Water point creation, retrieval, and validation
- Report submission and retrieval
- Description validation (required, non-empty, trimmed, <= 500 chars)
- Prevention of duplicate active reports (API 409 Conflict + DB partial unique index)
- Submitting a new report after previous report resolution
- Preservation of historical reports

