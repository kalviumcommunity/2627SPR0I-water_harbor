# Campus WaterPoint Board

**Course Repository (Public):** https://github.com/kalviumcommunity/2627SPR0I-water_harbor

## Problem Statement

Students carrying bottles visit several campus water points before finding one that works. Build a water-point issue board where students report unavailable dispensers and facilities staff confirm resolution. Show each location’s latest reported status and update time; keep reports available across shifts without claiming real-time sensor verification.

## Assigned Incident & Tracking Issue

- **Incident Issue:** [#4 — Incident: Campus WaterPoint Board — Dispenser Availability & Resolution Tracking](https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues/4)
- **Project Issues Board:** https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues
- **Product Requirements Document:** [Docs/PRD.md](Docs/PRD.md)

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
- Docker Desktop or Docker Engine with Docker Compose (for containerized setup; see [SETUP.md](SETUP.md))

### Clone Repository

```bash
git clone https://github.com/kalviumcommunity/2627SPR0I-water_harbor.git
cd 2627SPR0I-water_harbor
```

### Start Local Development (Current Foundation)

> **Note:** Full Docker Compose configuration and database integration are in progress; the commands below run the current backend and frontend foundation locally.

**Backend (FastAPI):**

```bash
cd backend
python -m venv venv
# Windows (Git Bash): source venv/Scripts/activate
# Windows (PowerShell): .\venv\Scripts\Activate.ps1
# macOS / Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend (Vite + React):**

```bash
cd frontend
npm install
npm run dev
```

### Planned Containerized Run (Docker Compose)

Once `docker-compose.yml` and `.env.example` are added:

```bash
docker compose up --build
```

Expected local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

Stop containers with:

```bash
docker compose down
```

### Test

Manually verify:
1. Students can view water points and submit unavailable reports.
2. Duplicate active reports are handled.
3. Staff can log in and view unresolved reports.
4. Only authorized staff can confirm resolution.
5. Status and timestamps update correctly.
6. Reports remain available after an application restart when the database volume is retained.

## Environment Variables

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `VITE_API_BASE_URL`

Refer to `.env.example` once added for the actual configuration.

## Demo Link

Pending implementation and final sprint demo.

## Project Board Link

- Incident Issue & Tracking: https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues/4
- Repository Issues: https://github.com/kalviumcommunity/2627SPR0I-water_harbor/issues
