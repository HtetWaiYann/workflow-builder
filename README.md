# Workflow Builder

A visual, node-based workflow builder that lets users design, configure, and run automation workflows through a drag-and-drop canvas — no code required.

## What it does

Users can construct workflows by connecting nodes on a canvas. Each node represents a discrete action (HTTP request, data transform, conditional branch, etc.), and edges define the execution order. A workflow can be saved, loaded, triggered manually or on a schedule, and its execution traced step by step.

**Planned features**

- Drag-and-drop canvas with node types (trigger, action, condition, output)
- Real-time execution status per node
- Workflow persistence (save / load / duplicate)
- Execution history and logs
- REST API for triggering workflows programmatically

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 6, React Compiler |
| Backend | Node.js, Express 4, TypeScript, ts-node-dev |
| Shared | TypeScript types and constants shared across packages |
| Monorepo | npm workspaces |

## Project structure

```
workflow-builder/
├── packages/
│   ├── shared/      # Shared TypeScript types, schemas, constants
│   ├── backend/     # Express REST API
│   └── frontend/    # React canvas UI
├── package.json     # Root — workspaces config + top-level scripts
└── tsconfig.json    # Base TypeScript config extended by each package
```

## Setup

**Prerequisites:** Node.js 24+, npm 10+

```bash
# 1. Clone the repo and install all dependencies from the root
npm install

# 2. Build the shared package (required before running backend or frontend)
npm run build:shared
```

## Running in development

Each package has its own dev server. Open two terminals:

```bash
# Terminal 1 — backend (http://localhost:3001)
npm run dev:backend

# Terminal 2 — frontend (http://localhost:5173)
npm run dev:frontend
```

When you change anything in `packages/shared`, rebuild it:

```bash
npm run build:shared
```

Or run the watcher in a third terminal to pick up shared changes automatically:

```bash
npm run dev --workspace=packages/shared
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{ status: "ok", timestamp }` |

## Environment variables

Copy `packages/backend/.env.example` to `packages/backend/.env` and adjust as needed:

```
PORT=3001
```
