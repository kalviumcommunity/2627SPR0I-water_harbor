
# Local Runtime and Tool Setup

## Machine Setup

The following tools are installed and verified on macOS.

| Tool | Version |
|---|---|
| Container Runtime | Docker Engine 29.5.2 |
| Compose | Docker Compose v5.1.4 |
| Git | git version 2.39.5 (Apple Git-154) |
| PostgreSQL Client | psql (PostgreSQL) 18.6 |

## Verification Commands

Run the following commands to verify the environment:

```bash
docker version --format '{{.Server.Version}}'
docker compose version
git --version
psql --version
```

## Container Runtime Test

Command:

```bash
docker run --rm hello-world
```

Result: Successful.

Docker pulled the hello-world image, created and executed a container, and displayed:

`Hello from Docker!`

This confirms that the Docker client successfully communicated with the Docker daemon and ran a container.

## Faculty-Approved Host

Pending confirmation from the faculty.

The host will be updated to one of the approved options:
- Render free tier
- Oracle Cloud free tier
- Campus VM

## Payment

No payment card or paid plan was used for this local setup.

## Environment Configuration

### Root Configuration (`.env` for Docker Compose)
Create a `.env` file in the project root directory based on `.env.example`:
- `POSTGRES_USER`: PostgreSQL database user (e.g., `postgres`).
- `POSTGRES_PASSWORD`: PostgreSQL database password.
- `POSTGRES_DB`: PostgreSQL database name (`waterpoint_db`).
- `DATABASE_URL`: Application database connection string.
- `TEST_DATABASE_URL`: Mandatory dedicated test database connection string (must be separate from `DATABASE_URL`).
- `SESSION_SECRET_KEY`: Random secret key used to sign staff session cookies (ephemeral random key generated if omitted).
- `REPORT_RATE_LIMIT_MAX_REQUESTS`: Max anonymous reports allowed per client IP within the rate-limit window (default: `5`).
- `REPORT_RATE_LIMIT_WINDOW_SECONDS`: Sliding window duration in seconds for `POST /api/reports` rate limiting (default: `60`).

### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_db`).
- `TEST_DATABASE_URL`: Connection string for integration tests (e.g., `postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_test_db`).
- `SESSION_SECRET_KEY`: Random secret key used to sign staff session cookies.
- `REPORT_RATE_LIMIT_MAX_REQUESTS` / `REPORT_RATE_LIMIT_WINDOW_SECONDS`: IP rate limit for anonymous `POST /api/reports` submissions (default: `5` requests per `60` seconds).
- `CORS_ORIGINS`: JSON array of allowed origins for the Vite dev server and deployed frontend.

### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory based on `frontend/.env.example`:
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:8000`).
