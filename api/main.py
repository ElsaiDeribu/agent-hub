"""FastAPI service that previews AI agents inside microsandbox microVMs.

microsandbox (>=0.6) is an embeddable, local-first runtime: the wheel bundles
the `msb` binary and `libkrunfw`, so this process spawns hardware-isolated
microVMs directly. There is no separate server to connect to. Because it boots
real VMs, the host must expose virtualization (`/dev/kvm` on Linux); see the
compose Dockerfiles / docker-compose.local.yml for how the container is granted that access.

Deploy a registry agent into an isolated sandbox, start it as a long-running
server, and proxy chat traffic to it with SSE streaming.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from microsandbox import is_installed
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from auth.router import router as auth_router
from config import settings
from db import engine, get_db
from evals.router import router as evals_router
from sessions.manager import SessionManager, get_session_manager
from sessions.reaper import reaper_loop
from sessions.router import router as sessions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager = SessionManager()
    app.state.sessions = manager
    reaper_task = asyncio.create_task(reaper_loop(manager))
    yield
    reaper_task.cancel()
    with suppress(asyncio.CancelledError):
        await reaper_task
    await manager.destroy_all()
    await engine.dispose()


_docs_enabled = settings.debug

app = FastAPI(
    title="microsandbox-demo",
    version="0.2.0",
    summary="Preview AI agents inside microsandbox microVMs.",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
    openapi_tags=[
        {"name": "health", "description": "Liveness and runtime status."},
        {"name": "sessions", "description": "Preview sessions inside microVMs."},
        {"name": "evals", "description": "Agent evaluation system."},
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


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    microsandbox_installed: bool
    active_sessions: int = Field(ge=0)


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health(
    db: Annotated[AsyncSession, Depends(get_db)],
    sessions: Annotated[SessionManager, Depends(get_session_manager)],
) -> HealthResponse:
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
        active_sessions=len(sessions.sessions),
    )


app.include_router(sessions_router, tags=["sessions"])
app.include_router(evals_router)
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


def main() -> None:
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
    )


if __name__ == "__main__":
    main()
