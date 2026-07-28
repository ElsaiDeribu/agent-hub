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

Sandbox previews use **deterministic mock agents** under
`registry/<agent-id>/preview/`. No model API keys are required.

## Endpoints

### Health

- `GET /health` — liveness; reports runtime status and active session count.

### Registry

- `GET /registry` — list agents that have a sandbox-ready `preview/` package.
- `GET /registry/{agent_id}` — get metadata for one agent.

### Sessions (agent preview)

- `POST /sessions/{agent_id}` — deploy an agent from the registry.
  Body: `{ "env": {} }` (optional; leave empty — previews need no API keys).
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

From the **repo root**:

```bash
docker compose -f backend/docker-compose.yml up --build
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
cd backend
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

By default the service reads agents from `../registry/<id>/preview/`.
Override with `REGISTRY_DIR` if needed.

The first session creation pulls the sandbox OCI image (`node` by default), so
it is slower than subsequent calls. Override the default image with the
`MSB_IMAGE` environment variable.

## Registry layout

Canonical catalog: repo-root `registry.json` + `registry/`.

Each sandbox-previewable agent has:

```
registry/<agent-id>/
  langchain|mastra|vercel-ai/...   # install templates (CLI)
  preview/
    metadata.json                  # sandbox metadata
    agent.ts                       # exports agent.stream() (mock for now)
    _preview.ts                    # HTTP harness on :3000
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MSB_IMAGE` | `node` | OCI image for sandboxes |
| `REGISTRY_DIR` | `../registry` (relative to backend) | Path to root registry |
| `CORS_ORIGINS` | docs/vite origins | Comma-separated allowed origins |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |
| `SESSION_IDLE_TIMEOUT` | `1800` | Seconds before idle session is reaped |
| `SESSION_MAX_DURATION` | `3600` | Max session lifetime in seconds |
| `SESSION_BASE_PORT` | `10000` | Starting port for session port allocation |
