"""Background loop that destroys idle or expired preview sessions."""

from __future__ import annotations

import asyncio

from config import settings

from .manager import SessionManager


async def reaper_loop(manager: SessionManager) -> None:
    while True:
        await asyncio.sleep(settings.session_reaper_interval)
        try:
            await manager.reap_idle()
        except Exception as exc:
            print(f"Reaper error: {exc}")
