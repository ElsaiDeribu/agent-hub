"""HttpOnly session cookie helpers."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import Response

from config import settings

COOKIE_SESSION = "agent_hub_session"


def attach_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_SESSION,
        value=token,
        max_age=settings.auth_session_expires_minutes * 60,
        httponly=True,
        samesite="lax",
        secure=settings.auth_cookie_secure,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_SESSION,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.auth_cookie_secure,
    )


def extract_session_token(request: Request) -> str | None:
    token = request.cookies.get(COOKIE_SESSION)
    if token:
        return token
    auth_header = request.headers.get("authorization") or ""
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip() or None
    return None
