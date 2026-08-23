"""In-memory lifecycle for agent preview sessions."""

from __future__ import annotations

import asyncio
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import Request
from microsandbox import Sandbox

from config import settings

from .sandbox import provision_sandbox

SessionPurpose = Literal["preview", "eval"]

SESSION_IDLE_TIMEOUT_S = settings.session_idle_timeout
SESSION_MAX_DURATION_S = settings.session_max_duration
SESSION_BASE_PORT = settings.session_base_port


@dataclass
class Session:
    session_id: str
    agent_id: str
    framework: str
    sandbox: Sandbox
    host_port: int
    owner_id: str
    purpose: SessionPurpose = "preview"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class SessionManager:
    def __init__(self, base_port: int = SESSION_BASE_PORT):
        self.sessions: dict[str, Session] = {}
        self._next_port = base_port
        self._lock = asyncio.Lock()

    def _allocate_port(self) -> int:
        port = self._next_port
        self._next_port += 1
        return port

    async def create_session(
        self,
        agent_id: str,
        framework: str,
        env: dict[str, str] | None = None,
        *,
        owner_id: str,
        purpose: SessionPurpose = "preview",
    ) -> Session:
        session_id = uuid4().hex

        async with self._lock:
            host_port = self._allocate_port()

        sb = await provision_sandbox(
            session_id, agent_id, framework, env, host_port
        )

        session = Session(
            session_id=session_id,
            agent_id=agent_id,
            framework=framework,
            sandbox=sb,
            host_port=host_port,
            owner_id=owner_id,
            purpose=purpose,
        )
        self.sessions[session_id] = session
        print(
            f"Session '{session_id}' created for agent '{agent_id}/{framework}' "
            f"on port {host_port}"
        )
        return session

    async def destroy_session(self, session_id: str) -> None:
        session = self.sessions.pop(session_id, None)
        if session is None:
            return
        try:
            await session.sandbox.stop()
        except Exception:
            with suppress(Exception):
                await session.sandbox.kill()
        print(f"Session '{session_id}' destroyed")

    async def destroy_all(self) -> None:
        ids = list(self.sessions.keys())
        for sid in ids:
            await self.destroy_session(sid)

    async def reap_idle(self) -> None:
        """Destroy sessions that exceed idle or max-duration limits."""
        now = datetime.now(timezone.utc)
        to_reap: list[str] = []
        for sid, s in self.sessions.items():
            idle = (now - s.last_activity).total_seconds()
            age = (now - s.created_at).total_seconds()
            if idle > SESSION_IDLE_TIMEOUT_S or age > SESSION_MAX_DURATION_S:
                to_reap.append(sid)
        for sid in to_reap:
            print(f"Reaping idle session '{sid}'")
            await self.destroy_session(sid)


def get_session_manager(request: Request) -> SessionManager:
    return request.app.state.sessions
