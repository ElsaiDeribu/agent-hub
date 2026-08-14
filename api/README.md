# microsandbox-demo

A FastAPI service that previews AI agents inside
[microsandbox](https://github.com/superradcompany/microsandbox) microVMs.

## How it works

microsandbox `>=0.6` is an **embeddable, local-first runtime**. The Python
wheel bundles the `msb` binary and `libkrunfw`, so the FastAPI process boots
hardware-isolated microVMs **directly in-process** — there is no separate
microsandbox server to run or connect to. The FastAPI app *is* the service.

Deploy a registry agent into its own isolated sandbox, start it as a
long-running HTTP server, and proxy chat messages to it with SSE streaming.

```
Docs UI  ──POST /sessions/customer-support──►  FastAPI
         ◄─── { session_id: "abc123" } ────────────

Docs UI  ──POST /sessions/abc123/chat──────────────►  FastAPI  ──► microVM :3000
         ◄─── SSE: data: {"type":"token","content":"The"} ◄──── Agent server
         ◄─── SSE: data: {"type":"done"}
```

Sandbox previews run the same files under
`registry/<agent-id>/<framework>/` that the docs code viewer shows. Each
framework package has its own `metadata.json` (`files`, `dependencies`, `env`).

## Endpoints

### Health

- `GET /health` — liveness; reports runtime status and active session count.

### Registry

- `GET /registry` — list sandbox-ready agent/framework packages.
- `GET /registry/{agent_id}` — list packages for an agent; pass `?framework=` for one package.

### Sessions (agent preview)

- `POST /sessions/{agent_id}` — deploy a framework package from the registry.
  Body (required): `{ "framework": "langchain", "env": { "OPENAI_API_KEY": "..." } }`.
- `GET /sessions` — list all active sessions.
- `GET /sessions/{id}/status` — health-check a running agent.
- `POST /sessions/{id}/chat` — send a message; returns SSE stream.
  Body: `{ "message": "...", "history": [] }`.
- `DELETE /sessions/{id}` — stop the sandbox and free resources.

Interactive docs are served at `/docs`.

## Requirements

microsandbox runs **real microVMs**, so it needs hardware virtualization:

- **Linux with KVM** (`/dev/kvm` present) — recommended, and what the Docker
  setup targets. On a cloud VM, enable **nested virtualization**.
- macOS (Apple Silicon) or Windows (preview, via Windows Hypervisor Platform)
  are supported for **local, non-Docker** runs.

> The Docker deployment below only works on a Linux host that can pass
> `/dev/kvm` into the container. It will **not** work under Docker Desktop on
> Windows/macOS.

## Run with Docker (Linux + KVM host)

Copy `api/.env.example` to `api/.env` first. The image **entrypoint** waits for
Postgres and builds `DATABASE_URL` from `POSTGRES_*`; **start** then runs
`alembic upgrade head` and uvicorn.

From the **repo root**:

```bash
docker compose -f api/docker-compose.yml up --build
```

Then, from another shell:

```bash
# List sandbox-ready agents
curl http://localhost:8000/registry

# Start a session (no API keys)
curl -X POST http://localhost:8000/sessions/customer-support \
  -H "Content-Type: application/json" \
  -d '{"env": {}}'
# {"session_id":"a1b2c3d4e5f6","status":"ready"}

# Chat (SSE streaming)
curl -N -X POST http://localhost:8000/sessions/a1b2c3d4e5f6/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Where is my order #12345?"}'

# Tear down
curl -X DELETE http://localhost:8000/sessions/a1b2c3d4e5f6
```

## Run locally (no Docker)

```bash
cd api
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

By default the service reads agents from `../registry/<id>/<framework>/`.
Override with `REGISTRY_DIR` if needed.

The first session creation pulls the sandbox OCI image (`node` by default), so
it is slower than subsequent calls. Override the default image with the
`MSB_IMAGE` environment variable.

## Registry layout

Canonical catalog: repo-root `registry.json` + `registry/`.

Each agent/framework package is the single source of truth:

```
registry/<agent-id>/<framework>/
  metadata.json     # files, dependencies, env, entrypoint, welcome copy
  agent.ts          # exports agent.stream() (sandbox + install surface)
  _preview.ts       # HTTP harness on :3000
  src/...           # optional modular implementation (also copied into sandbox)
```

## Database

The API uses **async SQLAlchemy** (`create_async_engine` + `AsyncSession`) in
`db.py`. Models live under `auth/models.py` (shared `Base`). Schema changes go
through **Alembic**, not `create_all`. Apply migrations before serving:

```bash
cd api
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "describe the change"
```

Docker uses an entrypoint/start pair:

1. `/entrypoint` (`api/compose/entrypoint`) waits for
   `${POSTGRES_HOST}:${POSTGRES_PORT}` and exports `DATABASE_URL` from
   `POSTGRES_*` (set in `docker-compose.yml`).
2. `docker-compose.yml` runs `/app/compose/start`, which applies
   `alembic upgrade head` and then uvicorn.

Existing databases that already have the auth tables but no `alembic_version`
row are stamped at head.

Postgres is required. For non-Docker runs set:

```bash
DATABASE_URL=postgresql+psycopg://agenthub:agenthub@localhost:5432/agenthub
```

With Docker Compose, Postgres is started and the entrypoint points the API at it:

```bash
docker compose -f api/docker-compose.yml up --build
```

Request bodies are validated with Pydantic (`auth/schemas.py`): `EmailStr`,
min/max length, and matching `confirm_password` on register.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | *(required)* | Postgres SQLAlchemy URL (`postgresql+psycopg://…`). Docker entrypoint overwrites this from `POSTGRES_*`. |
| `POSTGRES_HOST` | `postgres` | Postgres hostname inside Compose |
| `POSTGRES_PORT` | `5432` | Postgres port |
| `POSTGRES_DB` | `agenthub` | Database name |
| `POSTGRES_USER` | `agenthub` | Database user |
| `POSTGRES_PASSWORD` | `agenthub` | Database password |
| `MSB_IMAGE` | `node` | OCI image for sandboxes |
| `REGISTRY_DIR` | `../registry` (relative to api) | Path to root registry |
| `CORS_ORIGINS` | web/vite origins | Comma-separated allowed origins |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |
| `SESSION_IDLE_TIMEOUT` | `1800` | Seconds before idle session is reaped |
| `SESSION_MAX_DURATION` | `3600` | Max session lifetime in seconds |
| `SESSION_BASE_PORT` | `10000` | Starting port for session port allocation |
