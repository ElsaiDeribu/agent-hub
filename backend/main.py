"""FastAPI service that previews AI agents inside microsandbox microVMs.

microsandbox (>=0.6) is an embeddable, local-first runtime: the wheel bundles
the `msb` binary and `libkrunfw`, so this process spawns hardware-isolated
microVMs directly. There is no separate server to connect to. Because it boots
real VMs, the host must expose virtualization (`/dev/kvm` on Linux); see the
Dockerfile / docker-compose.yml for how the container is granted that access.

Deploy a registry agent into an isolated sandbox, start it as a long-running
server, and proxy chat traffic to it with SSE streaming.
"""

from __future__ import annotations

import asyncio
import json
import os
from contextlib import suppress
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from microsandbox import is_installed
from microsandbox.errors import MicrosandboxError

from services import (
    REGISTRY_DIR,
    manager,
    reaper_loop,
)

app = FastAPI(
    title="microsandbox-demo",
    version="0.2.0",
    summary="Preview AI agents inside microsandbox microVMs.",
)

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class CreateSessionResponse(BaseModel):
    session_id: str
    status: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message to send to the agent.")
    history: list[dict] = Field(default_factory=list, description="Previous conversation turns.")


class RegistryPreviewRequest(BaseModel):
    env: dict[str, str] = Field(default_factory=dict, description="Environment variables (e.g. API keys).")


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

_reaper_task: asyncio.Task | None = None


@app.on_event("startup")
async def startup_event():
    global _reaper_task
    _reaper_task = asyncio.create_task(reaper_loop())


@app.on_event("shutdown")
async def shutdown_event():
    global _reaper_task

    if _reaper_task is not None:
        _reaper_task.cancel()
        with suppress(asyncio.CancelledError):
            await _reaper_task
        _reaper_task = None

    await manager.destroy_all()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    """Liveness probe that also reports whether the microsandbox runtime is ready."""
    return {
        "status": "ok",
        "microsandbox_installed": is_installed(),
        "active_sessions": len(manager.sessions),
    }


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


@app.get("/registry")
async def list_registry() -> list[dict]:
    """List all agents available in the local registry."""
    agents = []
    if not REGISTRY_DIR.exists():
        return agents
    for entry in sorted(REGISTRY_DIR.iterdir()):
        meta_path = entry / "metadata.json"
        if entry.is_dir() and meta_path.exists():
            agents.append(json.loads(meta_path.read_text()))
    return agents


@app.get("/registry/{agent_id}")
async def get_registry_agent(agent_id: str) -> dict:
    """Get metadata for a specific registry agent."""
    meta_path = REGISTRY_DIR / agent_id / "metadata.json"
    if not meta_path.exists():
        raise HTTPException(404, f"Agent '{agent_id}' not found in registry")
    return json.loads(meta_path.read_text())


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


@app.post("/sessions/{agent_id}", response_model=CreateSessionResponse)
async def create_session(
    agent_id: str,
    req: RegistryPreviewRequest | None = None,
) -> CreateSessionResponse:
    """Load an agent from the local registry and start a preview session."""
    env = req.env if req else {}

    try:
        session = await manager.create_session(agent_id, env=env)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except MicrosandboxError as exc:
        raise HTTPException(status_code=502, detail=f"Sandbox error: {exc}")
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Agent HTTP error: {exc}")

    return CreateSessionResponse(session_id=session.session_id, status="ready")


@app.post("/sessions/{session_id}/chat")
async def chat(session_id: str, req: ChatRequest):
    """Stream a chat message to the agent running in the sandbox. Returns SSE."""
    session = manager.sessions.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found")

    session.last_activity = datetime.now(timezone.utc)

    async def proxy_stream():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    f"http://127.0.0.1:{session.host_port}/chat",
                    json={"message": req.message, "history": req.history},
                    timeout=120.0,
                ) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except httpx.ConnectError:
                yield f"data: {json.dumps({'type': 'error', 'content': 'Agent is not reachable'})}\n\n".encode()
            except httpx.ReadTimeout:
                yield f"data: {json.dumps({'type': 'error', 'content': 'Agent response timed out'})}\n\n".encode()

    return StreamingResponse(proxy_stream(), media_type="text/event-stream")


@app.get("/sessions/{session_id}/status")
async def session_status(session_id: str) -> dict:
    """Check the status of a preview session."""
    session = manager.sessions.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found")

    healthy = False
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(
                f"http://127.0.0.1:{session.host_port}/health",
                timeout=3.0,
            )
            healthy = r.status_code == 200
        except (httpx.ConnectError, httpx.ReadError):
            pass

    return {
        "session_id": session_id,
        "agent_id": session.agent_id,
        "status": "healthy" if healthy else "unhealthy",
        "created_at": session.created_at.isoformat(),
        "last_activity": session.last_activity.isoformat(),
    }


@app.get("/sessions")
async def list_sessions() -> list[dict]:
    """List all active preview sessions."""
    return [
        {
            "session_id": s.session_id,
            "agent_id": s.agent_id,
            "host_port": s.host_port,
            "created_at": s.created_at.isoformat(),
            "last_activity": s.last_activity.isoformat(),
        }
        for s in manager.sessions.values()
    ]


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str) -> dict:
    """Stop the agent sandbox and free resources."""
    if session_id not in manager.sessions:
        raise HTTPException(404, "Session not found")
    await manager.destroy_session(session_id)
    return {"session_id": session_id, "status": "destroyed"}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------


def main() -> None:
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8000")),
    )


if __name__ == "__main__":
    main()
