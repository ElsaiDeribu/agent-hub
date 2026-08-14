"""HttpOnly session cookie helpers."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import Response

from config import settings

COOKIE_SESSION = settings.auth_cookie_name


def _cookie_kwargs() -> dict:
    return {
        "key": settings.auth_cookie_name,
        "httponly": True,
        "samesite": settings.auth_cookie_samesite,
        "secure": settings.auth_cookie_secure,
        "path": "/",
    }


def attach_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        value=token,
        max_age=settings.auth_session_expires_minutes * 60,
        **_cookie_kwargs(),
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(**_cookie_kwargs())


def extract_session_token(request: Request) -> str | None:
    token = request.cookies.get(settings.auth_cookie_name)
    if token:
        return token
    auth_header = request.headers.get("authorization") or ""
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip() or None
    return None
