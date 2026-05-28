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
COPY packages/backend/ ./packages/backend/

# Build shared first (backend imports from @workflow-builder/shared)
RUN npm run build:shared

# Generate Prisma client into packages/backend/src/generated/prisma/
RUN cd packages/backend && npx prisma generate

# Compile TypeScript → dist/
RUN npm run build --workspace=packages/backend

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:24-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy workspace manifests + lockfile for a clean install.
# Intentionally omit packages/frontend/package.json — its deps are not needed
# at runtime and would bloat the image with React/Vite/etc.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Full npm ci (no --omit=dev) so prisma CLI is available for migrate deploy
RUN npm ci

# Copy compiled output and Prisma artefacts from builder.
# src/generated/ is intentionally omitted — tsc already compiled it into
# dist/generated/, which is what node dist/index.js imports at runtime.
COPY --from=builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=builder /app/packages/backend/dist/ ./packages/backend/dist/
COPY --from=builder /app/packages/backend/prisma/ ./packages/backend/prisma/
COPY --from=builder /app/packages/backend/prisma.config.ts ./packages/backend/prisma.config.ts

COPY packages/backend/docker-entrypoint.sh ./packages/backend/docker-entrypoint.sh
RUN chmod +x ./packages/backend/docker-entrypoint.sh

# Exposed only within the Docker network — not published to the host
EXPOSE 3001

WORKDIR /app/packages/backend

ENTRYPOINT ["./docker-entrypoint.sh"]
