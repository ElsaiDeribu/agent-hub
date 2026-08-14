"""PKCE helpers for Google OAuth."""

from __future__ import annotations

import base64
import hashlib
import secrets

OAUTH_STATE_TTL_SECONDS = 600


def generate_code_verifier() -> str:
    return secrets.token_urlsafe(96)


def generate_code_challenge(code_verifier: str) -> str:
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def new_oauth_state() -> tuple[str, str]:
    """Return `(state, code_verifier)` for a Google PKCE start."""
    return secrets.token_urlsafe(32), generate_code_verifier()
