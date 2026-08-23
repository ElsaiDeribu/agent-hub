"""Sandbox session lifecycle for eval runs."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sessions.manager import Session, SessionManager


@asynccontextmanager
async def eval_session(
    manager: SessionManager,
    agent_id: str,
    framework: str,
    env: dict[str, str],
    prefix: str,
    owner_id: str,
) -> AsyncIterator[Session]:
    """Create a sandbox session for an eval run and destroy it on exit."""
    print(f"{prefix} Creating session for '{agent_id}/{framework}'")
    session = await manager.create_session(
        agent_id, framework, env, owner_id=owner_id, purpose="eval"
    )
    print(f"{prefix} Session '{session.session_id}' created")
    print(f"{prefix} Sandbox created on port {session.host_port}")
    try:
        yield session
    finally:
        print(f"{prefix} Destroying sandbox for session '{session.session_id}'")
        await manager.destroy_session(session.session_id)
        print(f"{prefix} Sandbox destroyed")
