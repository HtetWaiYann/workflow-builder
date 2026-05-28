# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm ci

# Root tsconfig is required because packages/shared/tsconfig.json extends it
COPY tsconfig.json ./

# Copy only the source needed for this build
COPY packages/shared/ ./packages/shared/
COPY packages/frontend/ ./packages/frontend/

# Build shared first (frontend imports from @workflow-builder/shared)
RUN npm run build:shared

# VITE_API_URL is intentionally empty so the frontend uses relative paths.
# nginx will proxy all API routes to the backend container internally.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=packages/frontend

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/packages/frontend/dist/ /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
