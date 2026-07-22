# agent-hub

Open-source registry of reusable TypeScript AI agents, with a docs UI and a
sandbox preview backend.

## Layout

| Path | Role |
|------|------|
| `registry.json` | Canonical catalog (CLI + docs) |
| `registry/<agent>/` | Install templates per framework |
| `registry/<agent>/preview/` | Sandbox-runnable mock agents (**no API keys**) |
| `backend/` | FastAPI + microsandbox session runner |
| `docs/` | Browse / preview UI |
| `src/` | `agent-hub-harness` CLI |

## Quick start (local)

### 1. Backend (sandbox)

```bash
cd backend
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

Requires hardware virtualization (KVM on Linux, or WHP on Windows for local
runs). Docker+KVM only works on Linux hosts that expose `/dev/kvm`.

### 2. Docs UI

```bash
cd docs
cp .env.example .env   # VITE_HOST_API=http://localhost:8000
npm install
npm run dev
```

Open the docs, pick an agent, and use **Preview** — it creates a sandbox
session and streams SSE tokens. Previews are deterministic mocks; no model
API keys are collected or required.

### 3. CLI install (templates)

```bash
npx agent-hub-harness add customer-support --framework langchain
```

Install templates may document LLM keys for use in *your* project; the hub
preview path does not use them.
