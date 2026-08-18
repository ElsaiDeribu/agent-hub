"""FastAPI routes for email/password + Google OAuth with HttpOnly sessions."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db import get_db

from .models import User
from .schemas import (
    AUTH_ERROR_400,
    AUTH_ERROR_401,
    OAUTH_REDIRECT_RESPONSES,
    USER_RESPONSE,
    SignInRequest,
    SignOutResponse,
    SignUpPendingResponse,
    SignUpRequest,
    SocialSignInRequest,
    ResendVerificationRequest,
    UserPublic,
    UserResponse,
)
from .service import (
    consume_oauth_state,
    create_email_verification,
    exchange_google_code,
    get_authenticated_user,
    get_or_create_google_user,
    google_authorize_url,
    google_configured,
    google_userinfo,
    queue_verification_for_email,
    save_oauth_state,
    send_verification_email,
    sign_in as sign_in_service,
    sign_out as sign_out_service,
    sign_up as sign_up_service,
    verify_email_and_sign_in,
)
from .utils import (
    attach_session_cookie,
    clear_session_cookie,
    client_meta,
    error_response,
    extract_session_token,
    new_oauth_state,
    oauth_redirect,
    user_response,
)

router = APIRouter()


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """FastAPI dependency: require a valid session cookie or Bearer token."""
    token = extract_session_token(request)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing session cookie or Authorization header",
        )
    user = await get_authenticated_user(db, token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def _google_redirect_uri() -> str:
    return f"{settings.auth_base_url.rstrip('/')}/oauth/callback/google"


def _frontend_redirect_url() -> str:
    """Post-OAuth Location: configured frontend only, never a request parameter."""
    return (settings.auth_frontend_callback or "/").strip() or "/"


def _post_verify_redirect_url() -> str:
    base = settings.auth_frontend_callback.rstrip("/")
    path = settings.auth_post_verify_redirect_path.strip() or "/"
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{base}{path}"


def _sign_in_url() -> str:
    return f"{settings.auth_frontend_callback.rstrip('/')}/sign-in"


def _user_payload(user: User) -> dict:
    return UserPublic.model_validate(user).model_dump(mode="json")


async def _start_google(provider: str, db: AsyncSession) -> JSONResponse | RedirectResponse:
    provider = provider.strip().lower()
    if provider != "google":
        return error_response(400, "Only google provider is supported")
    if not google_configured():
        return error_response(400, "Google OAuth is not configured")

    state, code_verifier = new_oauth_state()
    await save_oauth_state(db, state, code_verifier)
    await db.commit()
    url = google_authorize_url(_google_redirect_uri(), state, code_verifier)
    return oauth_redirect(url)


@router.post(
    "/sign-up",
    response_model=SignUpPendingResponse,
    responses={400: AUTH_ERROR_400[400]},
)
async def sign_up(
    body: SignUpRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        ip, ua = client_meta(request)
        user = await sign_up_service(
            db,
            email=str(body.email),
            password=body.password,
            name=body.display_name,
            image=body.image,
            ip_address=ip,
            user_agent=ua,
        )
        raw_token = await create_email_verification(db, user.id)
        await db.commit()
    except ValueError as exc:
        return error_response(400, str(exc))

    background_tasks.add_task(send_verification_email, user, raw_token)
    return JSONResponse(
        content=SignUpPendingResponse(
            email=user.email,
            message="Verification email sent.",
        ).model_dump(mode="json")
    )


@router.post(
    "/sign-in",
    response_model=UserResponse,
    responses={**USER_RESPONSE, **AUTH_ERROR_400, **AUTH_ERROR_401},
)
async def sign_in(
    body: SignInRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    ip, ua = client_meta(request)
    try:
        result = await sign_in_service(
            db,
            email=str(body.email),
            password=body.password,
            ip_address=ip,
            user_agent=ua,
        )
    except ValueError as exc:
        return error_response(403, str(exc))
    if result is None:
        return error_response(401, "Invalid credentials")

    user, session = result
    await db.commit()
    return user_response(_user_payload(user), session.token)


@router.get(
    "/me",
    response_model=UserResponse,
    responses={**AUTH_ERROR_401},
)
async def me(current_user: CurrentUser):
    return JSONResponse(content={"user": _user_payload(current_user)})


@router.post("/sign-out", response_model=SignOutResponse)
async def sign_out(request: Request, db: Annotated[AsyncSession, Depends(get_db)]):
    token = extract_session_token(request)
    if token:
        await sign_out_service(db, token)
        await db.commit()
    response = JSONResponse(content={"success": True})
    clear_session_cookie(response)
    return response


@router.get(
    "/verify-email",
    response_model=None,
    status_code=302,
    responses=OAUTH_REDIRECT_RESPONSES,
)
async def verify_email(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    token: str = "",
):
    if not token.strip():
        return RedirectResponse(url=_sign_in_url(), status_code=302)

    ip, ua = client_meta(request)
    result = await verify_email_and_sign_in(
        db, token, ip_address=ip, user_agent=ua
    )
    await db.commit()
    if result is None:
        return RedirectResponse(url=_sign_in_url(), status_code=302)

    _user, session = result
    response = RedirectResponse(url=_post_verify_redirect_url(), status_code=302)
    attach_session_cookie(response, session.token)
    return response


@router.post("/resend-verification")
async def resend_verification(
    body: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        queued = await queue_verification_for_email(db, str(body.email))
        await db.commit()
    except ValueError as exc:
        return error_response(429, str(exc))

    if queued is not None:
        user, raw_token = queued
        background_tasks.add_task(send_verification_email, user, raw_token)

    return JSONResponse(content={"success": True})


@router.get(
    "/sign-in/social",
    response_model=None,
    status_code=302,
    responses=OAUTH_REDIRECT_RESPONSES,
)
async def sign_in_social_get(
    db: Annotated[AsyncSession, Depends(get_db)],
    provider: str = "google",
):
    return await _start_google(provider, db)


@router.post(
    "/sign-in/social",
    response_model=None,
    status_code=302,
    responses=OAUTH_REDIRECT_RESPONSES,
)
async def sign_in_social_post(
    db: Annotated[AsyncSession, Depends(get_db)],
    body: SocialSignInRequest = SocialSignInRequest(),
):
    return await _start_google(body.provider or "google", db)


@router.get(
    "/oauth/callback/google",
    response_model=None,
    status_code=302,
    responses=OAUTH_REDIRECT_RESPONSES,
)
async def google_callback(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    code: str | None = None,
    state: str | None = None,
):
    if not code or not state:
        return error_response(400, "code and state required")

    code_verifier = await consume_oauth_state(db, state)
    if not code_verifier:
        return error_response(400, "Invalid or expired state")

    try:
        tokens = await exchange_google_code(
            code, code_verifier, _google_redirect_uri()
        )
        access = tokens.get("access_token")
        if not access:
            return error_response(401, "No access token from Google")
        userinfo = await google_userinfo(str(access))
        google_id = str(userinfo.get("id") or userinfo.get("sub") or "")
        email = (userinfo.get("email") or "").strip().lower()
        if not google_id:
            return error_response(400, "No Google user id")
        if not email:
            return error_response(400, "Google account has no email")

        ip, ua = client_meta(request)
        _user, session = await get_or_create_google_user(
            db,
            google_id=google_id,
            email=email,
            name=(userinfo.get("name") or "").strip() or email,
            image=(userinfo.get("picture") or "").strip(),
            tokens=tokens,
            ip_address=ip,
            user_agent=ua,
        )
        await db.commit()
    except ValueError as exc:
        return error_response(401, str(exc))

    response = RedirectResponse(url=_frontend_redirect_url(), status_code=302)
    attach_session_cookie(response, session.token)
    return response
