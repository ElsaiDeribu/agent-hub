"""Provision a microsandbox microVM and start a registry agent inside it."""

from __future__ import annotations

import asyncio
from contextlib import suppress
from pathlib import Path

import httpx
from microsandbox import PortBinding, Sandbox
from microsandbox.errors import ExecTimeoutError, MicrosandboxError

from config import settings

from .utils.registry import RegistryError, fetch_package_files, fetch_package_metadata

DEFAULT_IMAGE = settings.msb_image


def _shell_quote(value: str) -> str:
    """Minimal single-quote escaping for embedding values in `sh -c`."""
    return "'" + value.replace("'", "'\"'\"'") + "'"


async def _read_agent_log(sb: Sandbox) -> str:
    try:
        result = await sb.exec("cat", ["/tmp/agent.log"], timeout=5.0)
        return result.stdout_text or result.stderr_text or ""
    except Exception as exc:
        return f"(could not read /tmp/agent.log: {exc})"


async def _wait_healthy(
    sb: Sandbox,
    port: int,
    retries: int = 40,
    delay: float = 1.0,
) -> None:
    """Retry until guest and host-published /health succeed.

    Catch all httpx transport errors (including RemoteProtocolError) —
    the port proxy often accepts TCP before the guest HTTP server is up.
    """
    last_err = ""
    for attempt in range(retries):
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
                    log = await _read_agent_log(sb)
                    print(f"Waiting for agent (attempt {attempt + 1}): {last_err}")
                    if log.strip():
                        print(f"agent.log:\n{log}")
        except (ExecTimeoutError, MicrosandboxError) as exc:
            last_err = f"exec error: {exc}"
            print(f"In-guest health check error (attempt {attempt + 1}): {exc}")

        await asyncio.sleep(delay)

    log = await _read_agent_log(sb)
    raise RuntimeError(
        f"Agent on port {port} did not become healthy after {retries} attempts. "
        f"Last error: {last_err}\nagent.log:\n{log}"
    )


async def provision_sandbox(
    session_id: str,
    agent_id: str,
    framework: str,
    env: dict[str, str] | None,
    host_port: int,
) -> Sandbox:
    """Fetch a registry package, boot a sandbox, install deps, and start the agent."""
    metadata = await fetch_package_metadata(agent_id, framework)
    entrypoint = metadata.get("entrypoint", "_preview.ts")
    dependencies = metadata.get("dependencies", [])
    relative_files = metadata.get("files", [])
    if not isinstance(relative_files, list) or not relative_files:
        raise RegistryError(
            f"Registry agent '{agent_id}/{framework}' lists no files"
        )

    required_env = metadata.get("env") or []
    provided = env or {}
    missing = [key for key in required_env if not str(provided.get(key, "")).strip()]
    if missing:
        raise ValueError(
            "Missing required environment variables: " + ", ".join(missing)
        )

    package_files = await fetch_package_files(agent_id, framework, relative_files)

    sb = await Sandbox.create(
        f"agent-{session_id}",
        image=DEFAULT_IMAGE,
        ports=[PortBinding.tcp(host_port, 3000)],
        memory=settings.sandbox_memory_mb,
        replace=True,
    )

    try:
        await sb.fs.mkdir("/app/agent")

        for rel_path, content in package_files.items():
            parts = Path(rel_path).parts
            for i in range(1, len(parts)):
                parent = "/app/agent/" + "/".join(parts[:i])
                await sb.fs.mkdir(parent)
            await sb.fs.write(f"/app/agent/{rel_path}", content)

        await sb.exec("npm", ["init", "-y"], cwd="/app/agent", timeout=30.0)
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

        env_exports = " ".join(
            f"export {k}={_shell_quote(v)};" for k, v in (env or {}).items()
        )

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

        await _wait_healthy(sb, host_port)
    except Exception:
        with suppress(Exception):
            await sb.stop()
        raise

    return sb
