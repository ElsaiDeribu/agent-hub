"""Pydantic request/response models for auth routes."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from config import settings


class SignUpRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(max_length=255, examples=["user@example.com"])
    password: str = Field(min_length=8, max_length=255, examples=["hunter2-plus"])
    name: str = Field(default="", max_length=255)
    image: str = Field(default="", max_length=512)
    first_name: str = Field(default="", max_length=255)
    last_name: str = Field(default="", max_length=255)
    confirm_password: str = Field(
        default="",
        max_length=255,
        description="If provided, must match `password`.",
    )

    @model_validator(mode="after")
    def passwords_match(self) -> SignUpRequest:
        if self.confirm_password and self.confirm_password != self.password:
            raise ValueError("passwords do not match")
        return self

    @property
    def display_name(self) -> str:
        if self.name:
            return self.name
        return " ".join(part for part in (self.first_name, self.last_name) if part)


class SignInRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(max_length=255, examples=["user@example.com"])
    password: str = Field(min_length=1, max_length=255)


class SocialSignInRequest(BaseModel):
    provider: str = Field(
        default="google",
        min_length=1,
        max_length=64,
        description="OAuth provider. Only `google` is supported.",
        examples=["google"],
    )


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    name: str
    image: str = ""
    email_verified: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @field_validator("image", mode="before")
    @classmethod
    def empty_image(cls, value: str | None) -> str:
        return value or ""


class UserResponse(BaseModel):
    user: UserPublic


class SignOutResponse(BaseModel):
    success: bool = True


class SignUpPendingResponse(BaseModel):
    email: EmailStr
    message: str = "Verification email sent."


class ResendVerificationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(max_length=255, examples=["user@example.com"])


class ErrorResponse(BaseModel):
    code: str = Field(examples=["BAD_REQUEST"])
    message: str


_SESSION_COOKIE_HEADER = {
    "Set-Cookie": {
        "description": f"HttpOnly session cookie (`{settings.auth_cookie_name}`).",
        "schema": {"type": "string"},
    }
}

USER_RESPONSE: dict[int | str, dict[str, Any]] = {
    200: {
        "model": UserResponse,
        "description": "Authenticated user. Sets the session cookie on sign-in and email verification.",
        "headers": _SESSION_COOKIE_HEADER,
    },
}

AUTH_ERROR_400: dict[int | str, dict[str, Any]] = {
    400: {"model": ErrorResponse, "description": "Invalid request"},
}

AUTH_ERROR_401: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Unauthorized"},
}

OAUTH_REDIRECT_RESPONSES: dict[int | str, dict[str, Any]] = {
    302: {
        "description": "Redirect to Google (authorize) or back to the frontend (callback).",
        "headers": _SESSION_COOKIE_HEADER,
    },
    400: {"model": ErrorResponse, "description": "Invalid request or OAuth not configured"},
    401: {"model": ErrorResponse, "description": "OAuth exchange failed"},
}
