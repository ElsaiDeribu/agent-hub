"""Auth helpers: security, cookies, OAuth PKCE, and HTTP responses."""

from .cookies import (
    COOKIE_SESSION,
    attach_session_cookie,
    clear_session_cookie,
    extract_session_token,
)
from .http import client_meta, error_response, oauth_redirect, user_response
from .oauth import (
    OAUTH_STATE_TTL_SECONDS,
    generate_code_challenge,
    generate_code_verifier,
    new_oauth_state,
)
from .security import (
    generate_session_token,
    hash_password,
    hash_verification_token,
    verify_password,
)

__all__ = [
    "COOKIE_SESSION",
    "OAUTH_STATE_TTL_SECONDS",
    "attach_session_cookie",
    "clear_session_cookie",
    "client_meta",
    "error_response",
    "extract_session_token",
    "generate_code_challenge",
    "generate_code_verifier",
    "generate_session_token",
    "hash_password",
    "hash_verification_token",
    "new_oauth_state",
    "oauth_redirect",
    "user_response",
    "verify_password",
]
