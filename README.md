# Workflow Builder

A visual, node-based workflow builder that lets users design, configure, and run automation workflows through a drag-and-drop canvas — no code required.

## What it does

Users construct workflows by connecting nodes on a canvas. Each node represents a discrete action (HTTP request, data transform, conditional branch, delay, etc.), and edges define the execution order. Workflows can be saved, triggered manually or on a schedule, and their execution traced step by step with per-node status.

**Features**

- Drag-and-drop canvas with node types: trigger, HTTP request, transformer, condition, delay, output
- Real-time execution status per node (running, success, failed, skipped)
- Undo / redo on the canvas
- Workflow persistence — save, load, duplicate
- Execution history and per-node logs
- Template interpolation — reference upstream node output with `$input`
- Workspace variables (encrypted at rest)
- REST API for triggering workflows programmatically
- Scheduled (cron) triggers via BullMQ + Redis

## Tech stack

| Layer         | Technology                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------- |
| Frontend      | React 19, Vite 8, TypeScript 6, React Compiler, React Flow, Zustand, Tailwind CSS, shadcn/ui |
| Backend       | Node.js 24, Express 4, TypeScript, Prisma ORM, BullMQ                                        |
| Database      | PostgreSQL 16                                                                                |
| Queue / Cache | Redis 7                                                                                      |
| Shared        | TypeScript types, Zod schemas shared across packages                                         |
| Monorepo      | npm workspaces                                                                               |
| Containers    | Docker, Docker Compose, nginx (production)                                                   |

## Project structure

```
workflow-builder/
├── packages/
│   ├── shared/          # Shared TypeScript types, Zod schemas, constants
│   ├── backend/         # Express REST API + execution engine + BullMQ worker
│   └── frontend/        # React canvas UI
├── docker/
│   └── nginx.conf       # nginx reverse-proxy config (production)
├── docker-compose.yml       # Production stack
├── docker-compose.dev.yml   # Development stack (hot reload)
├── package.json         # Root — workspaces config + top-level scripts
└── tsconfig.json        # Base TypeScript config extended by each package
```

---

## Running with Docker (recommended)

Docker is the easiest way to get the full stack running. It starts Postgres, Redis, the backend, and the frontend for you — no local Node, Postgres, or Redis installation needed.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Development (hot reload)

Source code changes on your laptop are reflected instantly inside the containers.

```bash
# Clone the repo
git clone <repo-url>
cd workflow-builder

# Copy both env files and fill in the required values
cp .env.example .env                                     # set POSTGRES_PASSWORD (required)
cp packages/backend/.env.example packages/backend/.env  # set JWT_SECRET, ENCRYPTION_KEY

# Start everything
docker compose -f docker-compose.dev.yml up
```

| Service         | URL                   |
| --------------- | --------------------- |
| Frontend (Vite) | http://localhost:5173 |
| Backend API     | http://localhost:3001 |

### Production

The production stack compiles the frontend to static files and serves everything through a single nginx reverse proxy on port 80. The backend is never exposed to the host directly.

```bash
# If you haven't already, copy and fill in both env files:
cp .env.example .env                                     # set POSTGRES_PASSWORD (required)
#                                                        # set CORS_ORIGIN if hosting on a domain
cp packages/backend/.env.example packages/backend/.env  # set JWT_SECRET, ENCRYPTION_KEY

docker compose up --build
```

App is available at **http://localhost**.

> **Hosting on a server?** Set `CORS_ORIGIN` in your root `.env` to the public URL you'll use,
> e.g. `CORS_ORIGIN=https://yourdomain.com`.

### Useful Docker commands

```bash
# Run in the background (detached)
docker compose -f docker-compose.dev.yml up -d

# View logs for a service
docker logs workflow-builder-backend-1 -f
docker logs workflow-builder-frontend-1 -f

# Check running containers and health status
docker compose -f docker-compose.dev.yml ps

# Stop all containers (data volumes are preserved)
docker compose -f docker-compose.dev.yml down

# Stop and wipe all data (deletes the database)
docker compose -f docker-compose.dev.yml down -v
```

---

## Running locally (without Docker)

**Prerequisites:** Node.js 24+, npm 10+, a running PostgreSQL instance, a running Redis instance.

```bash
# 1. Install all workspace dependencies from the repo root
npm install

# 2. Build the shared package (required before running backend or frontend)
npm run build:shared

# 3. Copy and configure the backend env file
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env — set DATABASE_URL, REDIS_URL, JWT_SECRET, ENCRYPTION_KEY

# 4. Run database migrations
npm run db:migrate --workspace=packages/backend
```

Open two terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
npm run dev:backend

# Terminal 2 — frontend (http://localhost:5173)
npm run dev:frontend
```

When you change anything in `packages/shared`, rebuild it:

```bash
npm run build:shared

# Or run the watcher in a third terminal to pick up changes automatically
npm run dev --workspace=packages/shared
```

---

## Environment variables

Copy `packages/backend/.env.example` to `packages/backend/.env` and fill in the required values:

| Variable         | Required | Description                                                                                                                                           |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string                                                                                                                          |
| `JWT_SECRET`     | Yes      | Secret used to sign JWT tokens (generate with `openssl rand -hex 32`)                                                                                 |
| `ENCRYPTION_KEY` | Yes      | 64-character hex key for AES-256-GCM credential encryption (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `REDIS_URL`      | No       | Redis connection string — cron triggers are disabled if unset                                                                                         |
| `PORT`           | No       | Backend port (default `3001`)                                                                                                                         |
| `JWT_EXPIRES_IN` | No       | Token lifetime (default `7d`)                                                                                                                         |
| `MAX_DELAY_MS`   | No       | Max delay node wait time in ms (default `300000`)                                                                                                     |

When running via Docker Compose, `DATABASE_URL`, `REDIS_URL`, and `CORS_ORIGIN` are **overridden** by the compose file to point at the internal Docker service names. The values in `.env` are only used for local (non-Docker) development.

`POSTGRES_USER` (default: `workflow`) and `POSTGRES_PASSWORD` (required) are read from the root `.env` file — they are used by both the Postgres container and the backend's `DATABASE_URL`.

---

## Other commands

```bash
# Type-check frontend (no emit)
cd packages/frontend && npx tsc -b

# Lint frontend
cd packages/frontend && npx eslint .

# Build everything for production
npm run build

# Generate Prisma client after schema changes
npm run db:generate --workspace=packages/backend

# Apply a new migration
npm run db:migrate --workspace=packages/backend

# Generate HTML documentation (TypeDoc)
npm run docs
```
