"""HTTP helpers for auth routes."""

from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse

from .cookies import attach_session_cookie


def client_meta(request: Request) -> tuple[str | None, str | None]:
    ip = request.headers.get("x-forwarded-for") or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    return ip, ua


def error_response(
    status: int, message: str, code: str | None = None
) -> JSONResponse:
    if code is None:
        code = "UNAUTHORIZED" if status == 401 else "BAD_REQUEST"
    return JSONResponse(
        status_code=status, content={"code": code, "message": message}
    )


def user_response(user_payload: dict[str, Any], token: str | None) -> JSONResponse:
    response = JSONResponse(content={"user": user_payload})
    if token:
        attach_session_cookie(response, token)
    return response


def oauth_redirect(url: str) -> RedirectResponse:
    return RedirectResponse(url=url, status_code=302)
