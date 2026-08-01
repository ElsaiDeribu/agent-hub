<h1 align="center">
  <img src="./assets/github-logo.svg" alt="agenthub" width="300" height="300" />
</h1>

Open-source registry of reusable TypeScript AI agents, with a docs UI and a
sandbox preview backend.

## Layout

| Path | Role |
|------|------|
| `registry.json` | Canonical catalog (CLI + docs) |
| `registry/<agent>/<framework>/` | Single source of truth: install files, code viewer, and sandbox package (`metadata.json`) |
| `api/` | FastAPI + microsandbox session runner |
| `web/` | Browse / preview UI |
| `cli/` | `agent-hub-harness` CLI |

## Quick start (local)

### 1. Backend (sandbox)

```bash
cd api
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

Requires hardware virtualization (KVM on Linux, or WHP on Windows for local
runs). Docker+KVM only works on Linux hosts that expose `/dev/kvm`.

### 2. Docs UI

```bash
cd web
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

To develop the CLI locally:

```bash
cd cli
npm install
npm run build
```

Install templates may document LLM keys for use in *your* project; the hub
preview path does not use them.
