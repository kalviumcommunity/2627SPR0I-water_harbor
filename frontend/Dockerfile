# ── frontend/Dockerfile ────────────────────────────────────────────────────
# Two-stage build:
#   Stage 1 (builder)  – Node 22 LTS, installs deps and runs `vite build`.
#   Stage 2 (runtime)  – Nginx alpine, serves the compiled static bundle.
#
# VITE_API_BASE_URL must be set at BUILD TIME so Vite embeds it into the
# JS bundle.  Pass it via the `args` section in docker-compose.yml.
# ---------------------------------------------------------------------------

# ── Stage 1: Vite build ─────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (leverages layer cache when src changes only)
COPY package.json package-lock.json ./
RUN npm ci

# Build-time API URL injected by docker-compose
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

# Copy source and build
COPY . .
RUN npm run build


# ── Stage 2: Nginx static server ────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Install our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy compiled static bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
