"""FastAPI service that previews AI agents inside microsandbox microVMs.

microsandbox (>=0.6) is an embeddable, local-first runtime: the wheel bundles
the `msb` binary and `libkrunfw`, so this process spawns hardware-isolated
microVMs directly. There is no separate server to connect to. Because it boots
real VMs, the host must expose virtualization (`/dev/kvm` on Linux); see the
compose Dockerfile / docker-compose.yml for how the container is granted that access.

Deploy a registry agent into an isolated sandbox, start it as a long-running
server, and proxy chat traffic to it with SSE streaming.
"""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timezone
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from microsandbox import is_installed
from microsandbox.errors import MicrosandboxError

from auth.router import router as auth_router
from config import settings
from db import engine, get_db
from schemas import (
    CHAT_STREAM_RESPONSES,
    CREATE_SESSION_ERRORS,
    REGISTRY_NOT_FOUND,
    SESSION_NOT_FOUND,
    ChatRequest,
    CreateSessionResponse,
    DeleteSessionResponse,
    HealthResponse,
    RegistryAgentDetail,
    RegistryPackage,
    RegistryPreviewRequest,
    SessionStatusResponse,
    SessionSummary,
)
from services import (
    REGISTRY_DIR,
    agent_impl_dir,
    list_frameworks,
    manager,
    reaper_loop,
)

_reaper_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _reaper_task
    _reaper_task = asyncio.create_task(reaper_loop())
    yield
    if _reaper_task is not None:
        _reaper_task.cancel()
        with suppress(asyncio.CancelledError):
            await _reaper_task
        _reaper_task = None
    await manager.destroy_all()
    await engine.dispose()


app = FastAPI(
    title="microsandbox-demo",
    version="0.2.0",
    summary="Preview AI agents inside microsandbox microVMs.",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "health", "description": "Liveness and runtime status."},
        {"name": "registry", "description": "Sandbox-ready agent packages."},
        {"name": "sessions", "description": "Preview sessions inside microVMs."},
        {"name": "auth", "description": "Email/password and Google OAuth sessions."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _validation_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Invalid request"
    err = errors[0]
    loc = ".".join(str(part) for part in err.get("loc", ()) if part != "body")
    msg = str(err.get("msg", "Invalid request"))
    if msg.startswith("Value error, "):
        msg = msg.removeprefix("Value error, ")
    if loc:
        return f"{loc}: {msg}"
    return msg


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"code": "BAD_REQUEST", "message": _validation_message(exc)},
    )

# Server-session auth (HttpOnly cookie): email/password + Google OAuth
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health(db: Annotated[AsyncSession, Depends(get_db)]) -> HealthResponse:
    """Liveness probe that also reports whether the microsandbox runtime is ready."""
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc
    return HealthResponse(
        status="ok",
        microsandbox_installed=is_installed(),
        active_sessions=len(manager.sessions),
    )


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


@app.get("/registry", response_model=list[RegistryPackage], tags=["registry"])
async def list_registry() -> list[RegistryPackage]:
    """List sandbox-ready agent/framework packages (`registry/<agent>/<framework>/`)."""
    packages: list[RegistryPackage] = []
    if not REGISTRY_DIR.exists():
        return packages
    for entry in sorted(REGISTRY_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith("_"):
            continue
        for framework in list_frameworks(entry.name):
            meta_path = agent_impl_dir(entry.name, framework) / "metadata.json"
            meta = json.loads(meta_path.read_text())
            meta.setdefault("id", entry.name)
            meta["framework"] = framework
            packages.append(RegistryPackage.model_validate(meta))
    return packages


@app.get(
    "/registry/{agent_id}",
    response_model=RegistryAgentDetail | RegistryPackage,
    responses=REGISTRY_NOT_FOUND,
    tags=["registry"],
)
async def get_registry_agent(
    agent_id: str, framework: str | None = None
) -> RegistryAgentDetail | RegistryPackage:
    """Get metadata for a registry agent. Pass `framework` for one package."""
    frameworks = list_frameworks(agent_id)
    if not frameworks:
        raise HTTPException(404, f"Agent '{agent_id}' not found in registry")

    if framework is None:
        packages = []
        for fw in frameworks:
            meta = json.loads(
                (agent_impl_dir(agent_id, fw) / "metadata.json").read_text()
            )
            meta["framework"] = fw
            packages.append(RegistryPackage.model_validate(meta))
        return RegistryAgentDetail(
            id=agent_id, frameworks=frameworks, packages=packages
        )

    try:
        meta_path = agent_impl_dir(agent_id, framework) / "metadata.json"
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc

    meta = json.loads(meta_path.read_text())
    meta.setdefault("id", agent_id)
    meta["framework"] = framework
    meta["frameworks"] = frameworks
    return RegistryPackage.model_validate(meta)


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


@app.post(
    "/sessions/{agent_id}",
    response_model=CreateSessionResponse,
    responses=CREATE_SESSION_ERRORS,
    tags=["sessions"],
)
async def create_session(
    agent_id: str,
    req: RegistryPreviewRequest,
) -> CreateSessionResponse:
    """Load an agent framework package from the registry and start a preview session."""
    try:
        session = await manager.create_session(
            agent_id, framework=req.framework, env=req.env
        )
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


@app.post(
    "/sessions/{session_id}/chat",
    response_class=StreamingResponse,
    responses=CHAT_STREAM_RESPONSES,
    tags=["sessions"],
)
async def chat(session_id: str, req: ChatRequest) -> StreamingResponse:
    """Stream a chat message to the agent running in the sandbox. Returns SSE."""
    session = manager.sessions.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found")

    session.last_activity = datetime.now(timezone.utc)
    history = [turn.model_dump() for turn in req.history]

    async def proxy_stream():
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    f"http://127.0.0.1:{session.host_port}/chat",
                    json={"message": req.message, "history": history},
                    timeout=120.0,
                ) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except httpx.ConnectError:
                yield f"data: {json.dumps({'type': 'error', 'content': 'Agent is not reachable'})}\n\n".encode()
            except httpx.ReadTimeout:
                yield f"data: {json.dumps({'type': 'error', 'content': 'Agent response timed out'})}\n\n".encode()

    return StreamingResponse(proxy_stream(), media_type="text/event-stream")


@app.get(
    "/sessions/{session_id}/status",
    response_model=SessionStatusResponse,
    responses=SESSION_NOT_FOUND,
    tags=["sessions"],
)
async def session_status(session_id: str) -> SessionStatusResponse:
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

    return SessionStatusResponse(
        session_id=session_id,
        agent_id=session.agent_id,
        framework=session.framework,
        status="healthy" if healthy else "unhealthy",
        created_at=session.created_at,
        last_activity=session.last_activity,
    )


@app.get("/sessions", response_model=list[SessionSummary], tags=["sessions"])
async def list_sessions() -> list[SessionSummary]:
    """List all active preview sessions."""
    return [
        SessionSummary(
            session_id=s.session_id,
            agent_id=s.agent_id,
            framework=s.framework,
            host_port=s.host_port,
            created_at=s.created_at,
            last_activity=s.last_activity,
        )
        for s in manager.sessions.values()
    ]


@app.delete(
    "/sessions/{session_id}",
    response_model=DeleteSessionResponse,
    responses=SESSION_NOT_FOUND,
    tags=["sessions"],
)
async def delete_session(session_id: str) -> DeleteSessionResponse:
    """Stop the agent sandbox and free resources."""
    if session_id not in manager.sessions:
        raise HTTPException(404, "Session not found")
    await manager.destroy_session(session_id)
    return DeleteSessionResponse(session_id=session_id, status="destroyed")


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------


def main() -> None:
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
    )


if __name__ == "__main__":
    main()
