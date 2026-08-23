"""Preview sessions inside microsandbox microVMs."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Annotated, NoReturn

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from microsandbox.errors import MicrosandboxError

from auth import CurrentUser

from .manager import Session, SessionManager, get_session_manager
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


def _require_preview_session(
    manager: SessionManager, session_id: str, user_id: str
) -> Session:
    session = manager.sessions.get(session_id)
    if (
        session is None
        or session.purpose != "preview"
        or session.owner_id != user_id
    ):
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post(
    "/sessions/{agent_id}",
    response_model=CreateSessionResponse,
    responses=CREATE_SESSION_ERRORS,
)
async def create_session(
    agent_id: str,
    req: RegistryPreviewRequest,
    manager: SessionMgr,
    current_user: CurrentUser,
) -> CreateSessionResponse:
    """Load an agent framework package from GitHub and start a preview session."""
    try:
        session = await manager.create_session(
            agent_id,
            framework=req.framework,
            env=req.env,
            owner_id=current_user.id,
            purpose="preview",
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
    session_id: str,
    req: ChatRequest,
    manager: SessionMgr,
    current_user: CurrentUser,
) -> StreamingResponse:
    """Stream a chat message to the agent running in the sandbox. Returns SSE."""
    session = _require_preview_session(manager, session_id, current_user.id)

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
    session_id: str, manager: SessionMgr, current_user: CurrentUser
) -> SessionStatusResponse:
    """Check the status of a preview session."""
    session = _require_preview_session(manager, session_id, current_user.id)

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
    session_id: str, manager: SessionMgr, current_user: CurrentUser
) -> DeleteSessionResponse:
    """Stop the agent sandbox and free resources."""
    _require_preview_session(manager, session_id, current_user.id)
    await manager.destroy_session(session_id)
    return DeleteSessionResponse(session_id=session_id, status="destroyed")
