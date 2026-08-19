"""Email/password and Google identity, plus server sessions."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode
from uuid import uuid4

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from utils.email import send_email

from .models import (
    EMAIL_PASSWORD_PROVIDER_ID,
    GOOGLE_PROVIDER_ID,
    Account,
    AuthSession,
    User,
    Verification,
)
from .exceptions import (
    AccountAlreadyLinkedError,
    AccountNotLinkedError,
    GoogleEmailNotVerifiedError,
)
from .utils import (
    OAUTH_STATE_TTL_SECONDS,
    generate_code_challenge,
    generate_session_token,
    hash_password,
    hash_verification_token,
    verify_password,
)

EMAIL_VERIFY_PREFIX = "email_verify:"


def google_configured() -> bool:
    return settings.google_configured


async def _create_session(
    db: AsyncSession,
    user_id: str,
    ip_address: str | None,
    user_agent: str | None,
) -> AuthSession:
    now = datetime.now(UTC)
    session = AuthSession(
        id=str(uuid4()),
        token=generate_session_token(),
        user_id=user_id,
        expires_at=now + timedelta(minutes=settings.auth_session_expires_minutes),
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    await db.flush()
    return session


async def _account_for(db: AsyncSession, user_id: str, provider_id: str) -> Account | None:
    result = await db.execute(
        select(Account).where(
            Account.user_id == user_id, Account.provider_id == provider_id
        )
    )
    return result.scalars().first()


async def _google_account_by_id(db: AsyncSession, google_id: str) -> Account | None:
    result = await db.execute(
        select(Account).where(
            Account.provider_id == GOOGLE_PROVIDER_ID,
            Account.account_id == google_id,
        )
    )
    return result.scalars().first()


def _apply_google_tokens(account: Account, tokens: dict[str, Any], now: datetime) -> None:
    account.access_token = tokens.get("access_token")
    account.refresh_token = tokens.get("refresh_token") or account.refresh_token
    account.id_token = tokens.get("id_token")
    account.scope = tokens.get("scope")
    account.updated_at = now


async def _upsert_google_account(
    db: AsyncSession,
    *,
    user_id: str,
    google_id: str,
    tokens: dict[str, Any],
    now: datetime,
) -> Account:
    existing_by_id = await _google_account_by_id(db, google_id)
    if existing_by_id is not None and existing_by_id.user_id != user_id:
        raise AccountAlreadyLinkedError(
            "This Google account is already linked to another user"
        )

    account = await _account_for(db, user_id, GOOGLE_PROVIDER_ID)
    if account is None:
        account = Account(
            id=str(uuid4()),
            account_id=google_id,
            provider_id=GOOGLE_PROVIDER_ID,
            user_id=user_id,
            created_at=now,
            updated_at=now,
        )
        db.add(account)
    elif account.account_id != google_id:
        raise AccountAlreadyLinkedError(
            "This user is already linked to a different Google account"
        )

    _apply_google_tokens(account, tokens, now)
    await db.flush()
    return account


async def sign_up(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    name: str = "",
    image: str = "",
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> User:
    email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalars().first()
    if existing is not None:
        raise ValueError("Account with this email already exists")

    now = datetime.now(UTC)
    user = User(
        id=str(uuid4()),
        email=email,
        name=name,
        image=image or "",
        email_verified=False,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    await db.flush()
    db.add(
        Account(
            id=str(uuid4()),
            account_id=user.id,
            provider_id=EMAIL_PASSWORD_PROVIDER_ID,
            user_id=user.id,
            password=hash_password(password),
            created_at=now,
            updated_at=now,
        )
    )
    return user


def _email_verify_identifier(token_hash: str) -> str:
    return f"{EMAIL_VERIFY_PREFIX}{token_hash}"


def _email_verify_url(raw_token: str) -> str:
    return f"{settings.auth_base_url.rstrip('/')}/verify-email?token={raw_token}"


async def _delete_email_verifications_for_user(db: AsyncSession, user_id: str) -> None:
    await db.execute(
        delete(Verification).where(
            Verification.identifier.like(f"{EMAIL_VERIFY_PREFIX}%"),
            Verification.value == user_id,
        )
    )


async def create_email_verification(db: AsyncSession, user_id: str) -> str:
    """Replace any pending token for the user and return a new raw token for the email link."""
    await _delete_email_verifications_for_user(db, user_id)

    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_verification_token(raw_token)
    now = datetime.now(UTC)
    db.add(
        Verification(
            id=str(uuid4()),
            identifier=_email_verify_identifier(token_hash),
            value=user_id,
            expires_at=now + timedelta(minutes=settings.auth_email_verify_ttl_minutes),
            created_at=now,
            updated_at=now,
        )
    )
    await db.flush()
    return raw_token


async def consume_email_verification(db: AsyncSession, raw_token: str) -> User | None:
    token_hash = hash_verification_token(raw_token.strip())
    result = await db.execute(
        select(Verification).where(
            Verification.identifier == _email_verify_identifier(token_hash)
        )
    )
    verification = result.scalars().first()
    if verification is None:
        return None

    expires_at = verification.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    user_id = verification.value
    await db.delete(verification)
    if expires_at < datetime.now(UTC):
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        return None

    user.email_verified = True
    user.updated_at = datetime.now(UTC)
    await db.flush()
    return user


async def can_resend_email_verification(db: AsyncSession, user_id: str) -> bool:
    result = await db.execute(
        select(Verification)
        .where(
            Verification.identifier.like(f"{EMAIL_VERIFY_PREFIX}%"),
            Verification.value == user_id,
        )
        .order_by(Verification.created_at.desc())
        .limit(1)
    )
    verification = result.scalars().first()
    if verification is None:
        return True

    created_at = verification.created_at
    if created_at is None:
        return True
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=UTC)
    cooldown = timedelta(seconds=settings.auth_email_verify_resend_cooldown_seconds)
    return datetime.now(UTC) >= created_at + cooldown


async def send_verification_email(user: User, raw_token: str) -> None:
    verify_url = _email_verify_url(raw_token)
    await send_email(
        to=user.email,
        subject="Verify your AgentHub email",
        body=f"Click the link below to verify your email:\n\n{verify_url}",
        html_content=(
            f'<p>Click the link below to verify your email:</p>'
            f'<p><a href="{verify_url}">Verify email</a></p>'
        ),
    )


async def queue_verification_for_email(
    db: AsyncSession, email: str
) -> tuple[User, str] | None:
    """Create a new verification token for an unverified user, or return None if not applicable."""
    email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None or user.email_verified:
        return None
    if not await can_resend_email_verification(db, user.id):
        raise ValueError("Please wait before requesting another email")
    raw_token = await create_email_verification(db, user.id)
    return user, raw_token


async def verify_email_and_sign_in(
    db: AsyncSession,
    raw_token: str,
    *,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[User, AuthSession] | None:
    user = await consume_email_verification(db, raw_token)
    if user is None:
        return None
    session = await _create_session(db, user.id, ip_address, user_agent)
    return user, session


async def sign_in(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[User, AuthSession] | None:
    result = await db.execute(select(User).where(User.email == email.strip().lower()))
    user = result.scalars().first()
    if user is None:
        return None
    account = await _account_for(db, user.id, EMAIL_PASSWORD_PROVIDER_ID)
    if account is None or not account.password:
        return None
    if not verify_password(password, account.password):
        return None
    if not user.email_verified:
        raise ValueError("Please verify your email before signing in.")
    return user, await _create_session(db, user.id, ip_address, user_agent)


async def sign_out(db: AsyncSession, token: str) -> None:
    result = await db.execute(select(AuthSession).where(AuthSession.token == token))
    session = result.scalars().first()
    if session is not None:
        await db.delete(session)


async def get_authenticated_user(db: AsyncSession, token: str) -> User | None:
    result = await db.execute(
        select(AuthSession)
        .options(selectinload(AuthSession.user))
        .where(AuthSession.token == token)
    )
    session = result.scalars().first()
    if session is None:
        return None
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at < datetime.now(UTC):
        return None
    return session.user


async def save_oauth_state(db: AsyncSession, state: str, code_verifier: str) -> None:
    now = datetime.now(UTC)
    db.add(
        Verification(
            id=str(uuid4()),
            identifier=state,
            value=code_verifier,
            expires_at=now + timedelta(seconds=OAUTH_STATE_TTL_SECONDS),
            created_at=now,
            updated_at=now,
        )
    )


async def consume_oauth_state(db: AsyncSession, state: str) -> str | None:
    result = await db.execute(select(Verification).where(Verification.identifier == state))
    verification = result.scalars().first()
    if verification is None:
        return None
    expires_at = verification.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    code_verifier = verification.value
    await db.delete(verification)
    if expires_at < datetime.now(UTC):
        return None
    return code_verifier or None


def google_authorize_url(redirect_uri: str, state: str, code_verifier: str) -> str:
    if not google_configured():
        raise ValueError("Google OAuth is not configured")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": settings.google_scopes,
        "state": state,
        "code_challenge": generate_code_challenge(code_verifier),
        "code_challenge_method": "S256",
        "prompt": "select_account",
    }
    return f"{settings.google_authorization_url}?{urlencode(params)}"


async def exchange_google_code(
    code: str, code_verifier: str, redirect_uri: str
) -> dict[str, Any]:
    if not google_configured():
        raise ValueError("Google OAuth is not configured")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.google_token_url,
                data={
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret.get_secret_value(),
                    "code_verifier": code_verifier,
                },
                headers={"Accept": "application/json"},
            )
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ValueError("Token exchange failed") from exc
    if (
        response.status_code >= 400
        or not isinstance(payload, dict)
        or not payload.get("access_token")
    ):
        raise ValueError("Token exchange failed")
    return payload


async def google_userinfo(access_token: str) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                settings.google_userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ValueError("Failed to fetch user info") from exc
    if response.status_code >= 400 or not isinstance(payload, dict):
        raise ValueError("Failed to fetch user info")
    return payload


async def handle_google_oauth(
    db: AsyncSession,
    *,
    google_id: str,
    email: str,
    name: str,
    image: str,
    tokens: dict[str, Any],
    google_email_verified: bool,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[User, AuthSession]:
    """Resolve Google OAuth sign-in with safe implicit account linking."""
    if not google_email_verified:
        raise GoogleEmailNotVerifiedError("Google email is not verified")

    email = email.strip().lower()
    now = datetime.now(UTC)

    linked_account = await _google_account_by_id(db, google_id)
    if linked_account is not None:
        result = await db.execute(select(User).where(User.id == linked_account.user_id))
        user = result.scalars().first()
        if user is None:
            raise ValueError("Linked Google account references a missing user")
        _apply_google_tokens(linked_account, tokens, now)
        linked_account.updated_at = now
        session = await _create_session(db, user.id, ip_address, user_agent)
        return user, session

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if user is None:
        user = User(
            id=str(uuid4()),
            email=email,
            name=name,
            image=image or "",
            email_verified=True,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        await db.flush()
        await _upsert_google_account(
            db, user_id=user.id, google_id=google_id, tokens=tokens, now=now
        )
        session = await _create_session(db, user.id, ip_address, user_agent)
        return user, session

    password_account = await _account_for(db, user.id, EMAIL_PASSWORD_PROVIDER_ID)
    google_account = await _account_for(db, user.id, GOOGLE_PROVIDER_ID)
    if password_account is not None and google_account is None:
        if not user.email_verified:
            raise AccountNotLinkedError(
                "An account with this email already exists. "
                "Verify your email, then sign in with Google again."
            )
        await _upsert_google_account(
            db, user_id=user.id, google_id=google_id, tokens=tokens, now=now
        )
        if image and not user.image:
            user.image = image
        user.updated_at = now
        session = await _create_session(db, user.id, ip_address, user_agent)
        return user, session

    if google_account is not None:
        raise AccountAlreadyLinkedError(
            "This user is already linked to a different Google account"
        )

    raise AccountNotLinkedError(
        "Unable to sign in with Google for this account. "
        "Sign in with your existing method first."
    )
