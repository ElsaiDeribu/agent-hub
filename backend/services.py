"""Session management for agent preview sandboxes."""

from __future__ import annotations

import asyncio
import json
import os
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import httpx

from microsandbox import PortBinding, Sandbox
from microsandbox.errors import ExecTimeoutError, MicrosandboxError


def _shell_quote(value: str) -> str:
    """Minimal single-quote escaping for embedding values in `sh -c`."""
    return "'" + value.replace("'", "'\"'\"'") + "'"


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_IMAGE = os.environ.get("MSB_IMAGE", "node")
# Canonical registry lives at repo-root `registry/<agent-id>/preview/`.
# Override with REGISTRY_DIR for Docker or alternate layouts.
_DEFAULT_REGISTRY = Path(__file__).resolve().parent.parent / "registry"
REGISTRY_DIR = Path(os.environ.get("REGISTRY_DIR", str(_DEFAULT_REGISTRY)))


def agent_preview_dir(agent_id: str) -> Path:
    """Resolve sandbox-runnable files for an agent (preview/ preferred)."""
    preview = REGISTRY_DIR / agent_id / "preview"
    if (preview / "metadata.json").is_file():
        return preview
    flat = REGISTRY_DIR / agent_id
    if (flat / "metadata.json").is_file():
        return flat
    return preview

SESSION_IDLE_TIMEOUT_S = int(os.environ.get("SESSION_IDLE_TIMEOUT", "1800"))
SESSION_MAX_DURATION_S = int(os.environ.get("SESSION_MAX_DURATION", "3600"))
SESSION_BASE_PORT = int(os.environ.get("SESSION_BASE_PORT", "10000"))


# ---------------------------------------------------------------------------
# Session manager
# ---------------------------------------------------------------------------


@dataclass
class Session:
    session_id: str
    agent_id: str
    sandbox: Sandbox
    host_port: int
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
        env: dict[str, str] | None = None,
    ) -> Session:
        agent_dir = agent_preview_dir(agent_id)
        meta_path = agent_dir / "metadata.json"
        if not meta_path.exists():
            raise FileNotFoundError(f"Agent '{agent_id}' not found in registry")

        metadata = json.loads(meta_path.read_text())
        entrypoint = metadata.get("entrypoint", "_preview.ts")
        dependencies = metadata.get("dependencies", [])
        relative_files = metadata.get("files", [])
        if not relative_files:
            raise RuntimeError(f"Registry agent '{agent_id}' lists no files")

        session_id = uuid4().hex[:12]

        async with self._lock:
            host_port = self._allocate_port()

        sb = await Sandbox.create(
            f"agent-{session_id}",
            image=DEFAULT_IMAGE,
            ports=[PortBinding.tcp(host_port, 3000)],
            memory=1024,
            replace=True,
        )

        try:
            await sb.fs.mkdir("/app/agent")

            agent_root = agent_dir.resolve()
            for rel_path in relative_files:
                host_path = (agent_dir / rel_path).resolve()
                if not host_path.is_relative_to(agent_root):
                    raise ValueError(f"Invalid registry path: {rel_path}")
                if not host_path.is_file():
                    raise FileNotFoundError(f"Registry file missing: {rel_path}")

                parts = Path(rel_path).parts
                if len(parts) > 1:
                    parent = "/app/agent/" + "/".join(parts[:-1])
                    await sb.fs.mkdir(parent)
                await sb.fs.write(f"/app/agent/{rel_path}", host_path.read_bytes())

            await sb.exec("npm", ["init", "-y"], cwd="/app/agent", timeout=30.0)
            # Ensure ESM so `import` in the preview harness works under Node/tsx.
            await sb.exec(
                "node",
                [
                    "-e",
                    "const fs=require('fs');"
                    "const p='/app/agent/package.json';"
                    "const j=JSON.parse(fs.readFileSync(p,'utf8'));"
                    "j.type='module';"
                    "fs.writeFileSync(p, JSON.stringify(j,null,2));",
                ],
                cwd="/app/agent",
                timeout=10.0,
            )
            await sb.exec("npm", ["install", "tsx"], cwd="/app/agent", timeout=180.0)

            if dependencies:
                await sb.exec(
                    "npm",
                    ["install"] + dependencies,
                    cwd="/app/agent",
                    timeout=300.0,
                )

            # Build env prefix for the shell (values are shell-escaped lightly).
            env_exports = " ".join(
                f"export {k}={_shell_quote(v)};" for k, v in (env or {}).items()
            )

            # Start agent in the background inside the guest. Using nohup + &
            # means the process outlives this exec call (unlike a foreground
            # exec_stream whose lifetime is tied to the handle iteration).
            start = await sb.exec(
                "sh",
                [
                    "-c",
                    f"{env_exports} "
                    f"nohup ./node_modules/.bin/tsx /app/agent/{entrypoint} "
                    f"> /tmp/agent.log 2>&1 & echo $!",
                ],
                cwd="/app/agent",
                timeout=15.0,
            )
            if not start.success:
                raise RuntimeError(
                    f"Failed to start agent process: {start.stderr_text or start.stdout_text}"
                )
            print(f"Agent PID in sandbox: {start.stdout_text.strip()}")

            await self._wait_healthy(sb, host_port)
        except Exception:
            with suppress(Exception):
                await sb.stop()
            raise

        session = Session(
            session_id=session_id,
            agent_id=agent_id,
            sandbox=sb,
            host_port=host_port,
        )
        self.sessions[session_id] = session
        print(f"Session '{session_id}' created for agent '{agent_id}' on port {host_port}")
        return session

    async def _read_agent_log(self, sb: Sandbox) -> str:
        try:
            result = await sb.exec("cat", ["/tmp/agent.log"], timeout=5.0)
            return result.stdout_text or result.stderr_text or ""
        except Exception as exc:
            return f"(could not read /tmp/agent.log: {exc})"

    async def _wait_healthy(
        self,
        sb: Sandbox,
        port: int,
        retries: int = 40,
        delay: float = 1.0,
    ):
        """Retry until guest and host-published /health succeed.

        Catch all httpx transport errors (including RemoteProtocolError) —
        the port proxy often accepts TCP before the guest HTTP server is up.
        """
        last_err = ""
        for attempt in range(retries):
            # 1) In-guest health check
            try:
                inside = await sb.exec(
                    "node",
                    [
                        "-e",
                        "fetch('http://127.0.0.1:3000/health')"
                        ".then(r=>r.text().then(t=>process.stdout.write(r.status+' '+t)))"
                        ".catch(e=>{process.stderr.write(String(e)); process.exit(1)})",
                    ],
                    timeout=5.0,
                )
                if inside.success and "200" in inside.stdout_text:
                    # 2) Host-published port used by the FastAPI proxy
                    try:
                        async with httpx.AsyncClient() as client:
                            r = await client.get(
                                f"http://127.0.0.1:{port}/health",
                                timeout=2.0,
                            )
                            if r.status_code == 200:
                                print(
                                    f"Agent on port {port} is healthy "
                                    f"(attempt {attempt + 1})"
                                )
                                return
                    except httpx.TransportError as exc:
                        last_err = f"host port: {exc}"
                        print(f"Host port {port} not ready (attempt {attempt + 1}): {exc}")
                else:
                    last_err = (
                        f"in-guest: exit={inside.exit_code} "
                        f"stdout={inside.stdout_text!r} stderr={inside.stderr_text!r}"
                    )
                    if attempt % 5 == 0:
                        log = await self._read_agent_log(sb)
                        print(f"Waiting for agent (attempt {attempt + 1}): {last_err}")
                        if log.strip():
                            print(f"agent.log:\n{log}")
            except (ExecTimeoutError, MicrosandboxError) as exc:
                last_err = f"exec error: {exc}"
                print(f"In-guest health check error (attempt {attempt + 1}): {exc}")

            await asyncio.sleep(delay)

        log = await self._read_agent_log(sb)
        raise RuntimeError(
            f"Agent on port {port} did not become healthy after {retries} attempts. "
            f"Last error: {last_err}\nagent.log:\n{log}"
        )

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


manager = SessionManager()


# ---------------------------------------------------------------------------
# Background reaper
# ---------------------------------------------------------------------------


async def reaper_loop() -> None:
    while True:
        await asyncio.sleep(60)
        try:
            await manager.reap_idle()
        except Exception as exc:
            print(f"Reaper error: {exc}")
