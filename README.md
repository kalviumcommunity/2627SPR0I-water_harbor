# Campus WaterPoint Board

**Course Repository (Public):** [https://github.com/kalviumcommunity/2627SPR0I-water_harbor](https://github.com/kalviumcommunity/2627SPR0I-water_harbor)

## Problem Statement

Students carrying bottles visit several campus water points before finding one that works. Build a water-point issue board where students report unavailable dispensers and facilities staff confirm resolution. Show each location’s latest reported status and update time; keep reports available across shifts without claiming real-time sensor verification.

## Assigned Incident & Tracking Issue

- **Incident Issue:** [#4 — Incident: Campus WaterPoint Board — Dispenser Availability & Resolution Tracking](https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues/4)
- **Project Issues Board:** [https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues](https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues)
- **Product Requirements Document:** [docs/PRD.md](docs/PRD.md)

## Team Details

- **Campus:** CHR
- **Squad:** 62
- **Team:** 03
- **Team Members:** Refer to [CONTRIBUTORS.md](CONTRIBUTORS.md)

## Team Workflow

1. Create a feature branch from `main` (e.g. `git checkout -b feature/<task-name>`).
2. Commit and push changes to the feature branch—never commit or push directly to `main`, which hides the diff and bypasses peer review.
3. Open a Pull Request targeting `main`, reference the tracking issue, and obtain a teammate review before merging.

## Tech Stack

- **Frontend:** React, JavaScript, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL, JWT Authentication and Password Hashing
- **Tooling:** Docker, Docker Compose, GitHub Actions

## Getting Started

### Prerequisites

- Git
- Python 3.12+ (for local backend development)
- Node.js & npm (for local frontend development)
- Docker Desktop or Docker Engine with Docker Compose (for containerized setup)

### Clone Repository

```bash
git clone https://github.com/kalviumcommunity/2627SPR0I-water_harbor.git
cd 2627SPR0I-water_harbor
```

### Start Local Development

The backend database integration with PostgreSQL 17 and SQLAlchemy 2.0 is complete. Follow the steps below or consult [backend/README.md](backend/README.md) for full details.

**Backend (FastAPI + PostgreSQL + Alembic):**

```bash
cd backend
python -m venv venv

# Windows (Git Bash): source venv/Scripts/activate
# Windows (PowerShell): .\venv\Scripts\Activate.ps1
# macOS / Linux: source venv/bin/activate

pip install -r requirements.txt

# Configure environment variables (PostgreSQL connection)
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload
```

Interactive documentation is available at `http://localhost:8000/docs`. Run tests with `pytest -v`.

**Frontend (Vite + React):**

```bash
cd frontend
npm install
npm run dev
```

### Start Containerized Application (Docker Compose)

Docker Compose runs the frontend, backend, and PostgreSQL database together.

**Prerequisites:** Docker Desktop or Docker Engine with Docker Compose installed and running.

Configure the required environment variables in the root `.env` file. Do not commit this file.

Start all services:

```bash
docker compose up --build -d
```

Once the containers are running, access the application at:

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:8000](http://localhost:8000)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

Check running containers:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs -f
```

Stop containers:

```bash
docker compose down
```

PostgreSQL data is stored in a persistent Docker volume and is retained when containers are stopped or removed using `docker compose down`. To remove the database volume and its stored data as well, use `docker compose down -v`.

**Note:** PostgreSQL is exposed on host port `5433` to avoid conflicts with an existing local PostgreSQL instance. Containers communicate internally using the PostgreSQL service on port `5432`.

### Test

Manually verify:

1. Students can view water points and submit unavailable reports.
2. Duplicate active reports are handled.
3. Staff can log in and view unresolved reports.
4. Only authorized staff can confirm resolution.
5. Status and timestamps update correctly.
6. Reports remain available after an application restart when the database volume is retained.

## Environment Variables

### Backend (`backend/.env`):

- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_db`)
- `TEST_DATABASE_URL`: Dedicated database connection string for tests (`waterpoint_test_db`)
- `ENVIRONMENT`: Application environment (`development`, `test`, or `production`; default: `development`)
- `SESSION_SECRET_KEY`: Signing key for expiring HttpOnly staff session cookies (**required in `production`, minimum 32 characters**; ephemeral random key generated in local development if omitted)
- `SESSION_COOKIE_SECURE`: Enforces `Secure` cookies (automatically required/`true` in `production`; auto-detected from HTTPS in development if omitted)
- `STAFF_SESSION_EXPIRE_MINUTES`: Staff session lifetime in minutes (default: `60`)
- `REPORT_RATE_LIMIT_ENABLED`: Enable/disable IP rate limiting on `POST /api/reports` (default: `true`)
- `REPORT_RATE_LIMIT_MAX_REQUESTS`: Max anonymous reports allowed per IP per window (default: `5`)
- `REPORT_RATE_LIMIT_WINDOW_SECONDS`: Rate limit window in seconds (default: `60`)
- `TRUSTED_PROXY_IPS`: Explicit trusted proxy IPs allowed to supply `X-Forwarded-For` (default: `[]`; arbitrary forwarded IP headers are ignored)
- `CORS_ORIGINS`: Allowed origins list for CORS (defaults to `["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:8000"]`)

### Frontend (`frontend/.env`):

- `VITE_API_URL`: Base URL of the backend FastAPI service (default: `http://localhost:8000`)

## GitHub Actions
GitHub Actions runs the project's CI workflows automatically when code is pushed to main or when a pull request targeting main is opened or updated.
Frontend CI: Installs frontend dependencies with npm ci, runs ESLint, and builds the frontend.
Backend CI: Starts an isolated PostgreSQL 17 service, installs backend dependencies, runs Alembic migrations, and executes the backend test suite with pytest -v.
To check the results, open the repository on GitHub, select the Actions tab or open a pull request and select Checks. Both Frontend CI and Backend CI should pass before merging.
These workflows provide Continuous Integration (CI). They do not deploy the application.

## Demo Link

Pending implementation and final sprint demo.

## Project Board Link

- Incident Issue & Tracking: [https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues/4](https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues/4)
- Repository Issues: [https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues](https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues)