"""On-demand GitHub client for fetching agent packages into a sandbox."""

from __future__ import annotations

import asyncio
import json
import re
import time
from pathlib import Path
from typing import Any

import httpx

from config import settings

_SLUG_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
_CATALOG_TTL_S = 60.0
_FETCH_TIMEOUT = httpx.Timeout(20.0)

_catalog: dict[str, Any] | None = None
_catalog_at: float = 0.0
_catalog_lock = asyncio.Lock()


class RegistryError(RuntimeError):
    """Failed to load registry content from GitHub."""


def _safe_slug(value: str, label: str) -> str:
    if not _SLUG_RE.fullmatch(value):
        raise ValueError(f"Invalid {label}: {value!r}")
    return value


def _sandbox_rel_path(rel_path: str) -> str:
    """Reject path traversal; return a posix-relative path for the sandbox."""
    posix = rel_path.replace("\\", "/").strip()
    while posix.startswith("./"):
        posix = posix[2:]
    path = Path(posix)
    if not posix or path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise ValueError(f"Invalid registry path: {rel_path}")
    return path.as_posix()


async def _get(client: httpx.AsyncClient, repo_path: str) -> httpx.Response:
    url = f"{settings.registry_raw_base}/{repo_path}"
    response = await client.get(url)
    if response.status_code == 404:
        raise FileNotFoundError(f"Registry file not found: {repo_path}")
    response.raise_for_status()
    return response


def _parse_json(response: httpx.Response, repo_path: str) -> dict[str, Any]:
    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise RegistryError(f"Invalid JSON in {repo_path}") from exc
    if not isinstance(data, dict):
        raise RegistryError(f"{repo_path} is not a JSON object")
    return data


async def _fetch_json(
    repo_path: str, client: httpx.AsyncClient | None = None
) -> dict[str, Any]:
    if client is not None:
        return _parse_json(await _get(client, repo_path), repo_path)

    async with httpx.AsyncClient(timeout=_FETCH_TIMEOUT, follow_redirects=True) as owned:
        return _parse_json(await _get(owned, repo_path), repo_path)


async def fetch_catalog(*, force: bool = False) -> dict[str, Any]:
    """Fetch `registry.json`, cached briefly to avoid hammering GitHub."""
    global _catalog, _catalog_at
    now = time.monotonic()
    if not force and _catalog is not None and (now - _catalog_at) < _CATALOG_TTL_S:
        return _catalog

    async with _catalog_lock:
        now = time.monotonic()
        if not force and _catalog is not None and (now - _catalog_at) < _CATALOG_TTL_S:
            return _catalog
        data = await _fetch_json("registry.json")
        _catalog = data
        _catalog_at = now
        return data


def _item_frameworks(item: dict[str, Any]) -> list[str]:
    files = item.get("frameworkFiles") or {}
    if isinstance(files, dict) and files:
        return [name for name in files if not str(name).startswith("_")]
    frameworks = item.get("frameworks") or []
    return [name for name in frameworks if not str(name).startswith("_")]


async def get_catalog_item(agent_id: str) -> dict[str, Any]:
    agent_id = _safe_slug(agent_id, "agent id")
    catalog = await fetch_catalog()
    for item in catalog.get("items") or []:
        if item.get("name") == agent_id:
            return item
    raise FileNotFoundError(f"Agent '{agent_id}' not found in registry")


async def list_frameworks(agent_id: str) -> list[str]:
    """Framework package names for an agent, from `registry.json`."""
    item = await get_catalog_item(agent_id)
    return _item_frameworks(item)


def _package_from_metadata(
    agent_id: str, framework: str, metadata: dict[str, Any]
) -> dict[str, Any]:
    meta = dict(metadata)
    meta.setdefault("id", agent_id)
    meta["framework"] = framework
    return meta


async def fetch_package_metadata(agent_id: str, framework: str) -> dict[str, Any]:
    agent_id = _safe_slug(agent_id, "agent id")
    framework = _safe_slug(framework, "framework")
    frameworks = await list_frameworks(agent_id)
    if framework not in frameworks:
        raise FileNotFoundError(
            f"Framework '{framework}' not found for agent '{agent_id}'. "
            f"Available: {', '.join(frameworks)}"
        )
    metadata = await _fetch_json(f"registry/{agent_id}/{framework}/metadata.json")
    return _package_from_metadata(agent_id, framework, metadata)


async def fetch_package_files(
    agent_id: str, framework: str, relative_files: list[str]
) -> dict[str, bytes]:
    """Download package files listed in metadata.json `files`."""
    agent_id = _safe_slug(agent_id, "agent id")
    framework = _safe_slug(framework, "framework")
    async with httpx.AsyncClient(timeout=_FETCH_TIMEOUT, follow_redirects=True) as client:

        async def one(rel_path: str) -> tuple[str, bytes]:
            safe = _sandbox_rel_path(rel_path)
            repo_path = f"registry/{agent_id}/{framework}/{safe}"
            response = await _get(client, repo_path)
            return safe, response.content

        pairs = await asyncio.gather(*[one(rel) for rel in relative_files])
    return dict(pairs)
