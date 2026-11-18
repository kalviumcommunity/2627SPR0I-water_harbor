# ── backend/Dockerfile ─────────────────────────────────────────────────────
# Multi-stage build: install deps in a build stage, copy artefacts only.
#
# Base image: slim official Python 3.12 (matches local dev environment).
# psycopg[binary] bundles its own libpq, so no extra apt packages needed.
# ---------------------------------------------------------------------------

# ── Stage 1: dependency install ─────────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /install

# Install build tooling required by some psycopg binary wheels on some arches
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/pkg -r requirements.txt


# ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy installed packages from build stage
COPY --from=deps /install/pkg /usr/local

# Copy application source
COPY . .

# Non-root user for least-privilege execution
RUN useradd --no-create-home --shell /bin/false appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Start Uvicorn; Alembic migration entrypoint is handled by docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
