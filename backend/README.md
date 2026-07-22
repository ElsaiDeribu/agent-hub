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
Frontend  ──POST /sessions/simple-qa──►  FastAPI
          ◄─── { session_id: "abc123" } ────────────

Frontend  ──POST /sessions/abc123/chat──────────────►  FastAPI  ──► microVM :3000
          ◄─── SSE: data: {"type":"token","content":"The"} ◄──── Agent server
          ◄─── SSE: data: {"type":"done"}
```

## Endpoints

### Health

- `GET /health` — liveness; reports runtime status and active session count.

### Registry

- `GET /registry` — list all agents in the local registry.
- `GET /registry/{agent_id}` — get metadata for one agent.

### Sessions (agent preview)

- `POST /sessions/{agent_id}` — deploy an agent from the local registry.
  Body: `{ "env": {"OPENAI_API_KEY": "sk-..."} }` (optional).
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

```bash
docker compose up --build
```

Then, from another shell:

```bash
# ── Agent preview: start a session from the registry ──

curl -X POST http://localhost:8000/sessions/simple-qa \
  -H "Content-Type: application/json" \
  -d '{"env": {"OPENAI_API_KEY": "sk-your-key-here"}}'
# {"session_id":"a1b2c3d4e5f6","status":"ready"}

# ── Chat with the running agent (SSE streaming) ──

curl -N -X POST http://localhost:8000/sessions/a1b2c3d4e5f6/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the capital of France?"}'
# data: {"type":"token","content":"The"}
# data: {"type":"token","content":" capital"}
# ...
# data: {"type":"done"}

# ── Tear down the session ──

curl -X DELETE http://localhost:8000/sessions/a1b2c3d4e5f6
# {"session_id":"a1b2c3d4e5f6","status":"destroyed"}
```

## Run locally (no Docker)

```bash
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

The first session creation pulls the sandbox OCI image (`node` by default), so
it is slower than subsequent calls. Override the default image with the
`MSB_IMAGE` environment variable.

## Registry

Agents live in `registry/<agent-id>/`. Each agent has:

- `metadata.json` — name, description, dependencies, entrypoint, required env vars.
- `agent.ts` — the agent logic (exports a `stream()` async generator).
- `_preview.ts` — HTTP server harness that wraps the agent for sandbox execution.

Currently included:

| Agent | Description |
|-------|-------------|
| `simple-qa` | Minimal LangChain agent using GPT-4o-mini with streaming |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MSB_IMAGE` | `node` | OCI image for sandboxes |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |
| `SESSION_IDLE_TIMEOUT` | `1800` | Seconds before idle session is reaped |
| `SESSION_MAX_DURATION` | `3600` | Max session lifetime in seconds |
| `SESSION_BASE_PORT` | `10000` | Starting port for session port allocation |
