# Local Runtime, Setup, and Presentation Guide

## 1. Machine Setup

The following tools are installed and verified:

| Tool | Version |
|---|---|
| Container Runtime | Docker Engine 29.5.2 / Docker Desktop |
| Compose | Docker Compose v5.1.4+ |
| Git | git version 2.39+ / 2.49+ |
| PostgreSQL Client | psql (PostgreSQL) 17+ / 18+ |

### Verification Commands

Run the following commands to verify your local environment:

```bash
docker version --format '{{.Server.Version}}'
docker compose version
git --version
psql --version
```

### Container Runtime Test

```bash
docker run --rm hello-world
```

**Result:** Successful. Docker pulled the `hello-world` image, executed a container, and displayed `Hello from Docker!`. This confirms the Docker client communicates properly with the daemon.

---

## 2. Environment Configuration

### Root Configuration (`.env` for Docker Compose)
Create a `.env` file in the project root directory based on `.env.example`:
- `POSTGRES_USER`: PostgreSQL database user (default: `gowrish` or `postgres`).
- `POSTGRES_PASSWORD`: PostgreSQL database password (default: `waterharbor_dev`).
- `POSTGRES_DB`: PostgreSQL database name (`waterpoint_db`).
- `DATABASE_URL`: Application database connection string.
- `TEST_DATABASE_URL`: Dedicated test database connection string (must be separate from `DATABASE_URL`).
- `ENVIRONMENT`: Runtime environment (`development`, `test`, or `production`; default: `development`).
- `SESSION_SECRET_KEY`: Signing key for staff sessions; required in production with at least 32 characters. Development/test can generate an ephemeral key if omitted.
- `SESSION_COOKIE_SECURE`: Automatically enforced as `true` in production; auto-detected from HTTPS in development.
- `REPORT_RATE_LIMIT_MAX_REQUESTS`: Max anonymous reports allowed per client IP within the window (default: `5`).
- `REPORT_RATE_LIMIT_WINDOW_SECONDS`: Sliding window duration in seconds for `POST /api/reports` rate limiting (default: `60`).

### Backend Configuration (`backend/.env`)
Create a `.env` file in `backend/` based on `backend/.env.example`:
- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_db`).
- `TEST_DATABASE_URL`: Connection string for integration tests (e.g., `postgresql+psycopg://postgres:postgres@localhost:5432/waterpoint_test_db`).
- `SESSION_SECRET_KEY`: Signing key for staff sessions; required in production with at least 32 characters.
- `REPORT_RATE_LIMIT_MAX_REQUESTS` / `REPORT_RATE_LIMIT_WINDOW_SECONDS`: IP rate limit for anonymous report submissions.
- `CORS_ORIGINS`: JSON array of allowed origins for the Vite dev server and deployed frontend.

### Frontend Configuration (`frontend/.env`)
Create a `.env` file in `frontend/` based on `frontend/.env.example`:
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:8000`).

---

## 3. Project Walkthrough & Presentation Guide

### Step 1: Start the Project

1. Open **Docker Desktop** and wait until Docker is running.
2. Open your **Terminal**.
3. Navigate to your project folder:
   ```bash
   cd "/Users/gowrish/Desktop/simulate/2627SPR0I---water_harbor"
   ```
4. Start the entire project using Docker Compose:
   ```bash
   docker compose up --build -d
   ```
5. Check whether all containers are running:
   ```bash
   docker compose ps
   ```
   Verify that `water_harbor_frontend`, `water_harbor_backend`, and `water_harbor_db` are all running and healthy.

---

### Step 2: Open the Project

Open your web browser and navigate to the following endpoints:

| What to Show | URL |
|---|---|
| **Water Harbor Website** | [http://localhost:5173](http://localhost:5173) |
| **Backend API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) |

- Start with the website. Demonstrate the key user flows:
  - Campus overview statistics and live status indicators.
  - Searching and filtering water points across campus buildings.
  - Submitting a student issue report for an unavailable dispenser.
  - Accessing the Facilities Staff Desk to review reports and record confirmed repairs.
- **Note:** You do not need to run `npm run dev` or start the backend separately; Docker Compose has already built and started them.

---

### Step 3: If Asked to See the Database

Keep Docker running.

1. Open a second Terminal window and navigate to the project directory:
   ```bash
   cd "/Users/gowrish/Desktop/simulate/2627SPR0I---water_harbor"
   ```
2. Connect to the running PostgreSQL container:
   ```bash
   docker compose exec db psql -U gowrish -d waterpoint_db
   ```
3. Execute the following SQL commands one by one:
   - **Show available tables:**
     ```sql
     \dt
     ```
   - **Show water points:**
     ```sql
     SELECT * FROM water_points;
     ```
   - **Show reported issues:**
     ```sql
     SELECT * FROM issue_reports;
     ```
   - **Exit PostgreSQL:**
     ```sql
     \q
     ```
4. If a table is empty, show its structure instead:
   ```sql
   \d water_points
   ```

---

### Step 4: Show Backend APIs (If Asked)

Open the interactive Swagger UI:
[http://localhost:8000/docs](http://localhost:8000/docs)

- Demonstrate available endpoints:
  - `GET /api/water-points`: List campus water dispensers and their live computed status.
  - `POST /api/reports`: Anonymous student issue reporting with rate limiting.
  - `POST /api/staff/login`: Staff access key authentication issuing HttpOnly session cookies.
  - `GET /api/staff/reports`: Facilities view of unresolved notices.
  - `PATCH /api/reports/{id}/resolve`: Technician resolution logging with CSRF protection.
- Execute a test request directly in Swagger UI to show real-time responses.

---

### Step 5: Stop the Project After Presentation

Return to your Terminal and run:

```bash
docker compose down
```

> **Warning:** Do not use `docker compose down -v` because that flag deletes the persistent database volume.

---

## 4. Faculty-Approved Host

Pending confirmation from the faculty.

The host will be updated to one of the approved options:
- Render free tier
- Oracle Cloud free tier
- Campus VM

## 5. Payment Declaration

No payment card or paid plan was used for this setup. All components run on free-tier, open-source containerized infrastructure.
