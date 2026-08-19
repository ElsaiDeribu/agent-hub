"""Preview sessions inside microsandbox microVMs."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Annotated, NoReturn

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from microsandbox.errors import MicrosandboxError

from .manager import SessionManager, get_session_manager
from .utils.registry import RegistryError
from .schemas import (
    CHAT_STREAM_RESPONSES,
    CREATE_SESSION_ERRORS,
    SESSION_NOT_FOUND,
    ChatRequest,
    CreateSessionResponse,
    DeleteSessionResponse,
    RegistryPreviewRequest,
    SessionStatusResponse,
)

router = APIRouter()

SessionMgr = Annotated[SessionManager, Depends(get_session_manager)]


def _reraise_registry_http(exc: BaseException) -> NoReturn:
    if isinstance(exc, FileNotFoundError):
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if isinstance(exc, RegistryError):
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if isinstance(exc, httpx.HTTPError):
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch registry: {exc}"
        ) from exc
    raise exc


@router.post(
    "/sessions/{agent_id}",
    response_model=CreateSessionResponse,
    responses=CREATE_SESSION_ERRORS,
)
async def create_session(
    agent_id: str,
    req: RegistryPreviewRequest,
    manager: SessionMgr,
) -> CreateSessionResponse:
    """Load an agent framework package from GitHub and start a preview session."""
    try:
        session = await manager.create_session(
            agent_id, framework=req.framework, env=req.env
        )
    except MicrosandboxError as exc:
        raise HTTPException(status_code=502, detail=f"Sandbox error: {exc}") from exc
    except RuntimeError as exc:
        # RegistryError is a RuntimeError subclass and must stay 502, not 504.
        if not isinstance(exc, RegistryError):
            raise HTTPException(status_code=504, detail=str(exc)) from exc
        _reraise_registry_http(exc)
    except Exception as exc:
        _reraise_registry_http(exc)

    return CreateSessionResponse(session_id=session.session_id, status="ready")


@router.post(
    "/sessions/{session_id}/chat",
    response_class=StreamingResponse,
    responses=CHAT_STREAM_RESPONSES,
)
async def chat(
    session_id: str, req: ChatRequest, manager: SessionMgr
) -> StreamingResponse:
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


@router.get(
    "/sessions/{session_id}/status",
    response_model=SessionStatusResponse,
    responses=SESSION_NOT_FOUND,
)
async def session_status(
    session_id: str, manager: SessionMgr
) -> SessionStatusResponse:
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


@router.delete(
    "/sessions/{session_id}",
    response_model=DeleteSessionResponse,
    responses=SESSION_NOT_FOUND,
)
async def delete_session(
    session_id: str, manager: SessionMgr
) -> DeleteSessionResponse:
    """Stop the agent sandbox and free resources."""
    if session_id not in manager.sessions:
        raise HTTPException(404, "Session not found")
    await manager.destroy_session(session_id)
    return DeleteSessionResponse(session_id=session_id, status="destroyed")
