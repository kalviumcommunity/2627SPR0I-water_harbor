# Campus WaterPoint Board - Frontend

React + Vite + Tailwind CSS frontend for **Campus WaterPoint Board** (Campus CHR, Squad 62, Team 03).

## Features

1. **Public WaterPoint Directory (`/`)**:
   - Browse campus water points across buildings and floors.
   - Status indicators strictly aligned with PRD rules:
     - `Reported Unavailable`
     - `Staff-Confirmed Resolved`
     - `No Recent Report / Unknown` (never labeled as "Working").
   - Filter by building, floor, or status; search by keyword.
   - KPI metrics summary cards.
   - Clear disclaimer that statuses reflect community reports and staff confirmations, without IoT sensor claims.

2. **Student Issue Reporting (`/report`)**:
   - Unauthenticated student reporting (no account/login required).
   - Quick issue description presets and custom note inputs.
   - Duplicate active report detection (prevents duplicate tickets and shows existing issue details).

3. **Facilities Staff Dashboard (`/staff`)**:
   - Authenticated staff management.
   - Unresolved issues queue (`reported_unavailable`).
   - One-click resolution confirmation with staff attribution and notes.
   - Resolution history log (`staff_confirmed_resolved`).

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default API URL is `http://localhost:8000`.

### 3. Start Development Server
```bash
npm run dev
```
The app runs at `http://localhost:5173`.

### 4. Run Lint & Build
```bash
npm run lint
npm run build
```
