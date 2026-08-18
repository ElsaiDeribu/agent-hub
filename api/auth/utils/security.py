"""Password hashing and session tokens."""

from __future__ import annotations

import hashlib
import secrets

from passlib.context import CryptContext

_PWD_CTX = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _PWD_CTX.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bool(_PWD_CTX.verify(password, password_hash))
    except Exception:
        return False


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_verification_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()
