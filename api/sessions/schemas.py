"""Pydantic request/response models for preview session routes."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HTTPExceptionResponse(BaseModel):
    detail: str


class RegistryPreviewRequest(BaseModel):
    framework: str = Field(
        min_length=1,
        max_length=64,
        description="Framework package under registry/<agent>/<framework>/ on GitHub.",
        examples=["langchain"],
    )
    env: dict[str, str] = Field(
        default_factory=dict,
        description="Environment variables (e.g. API keys).",
        examples=[{"OPENAI_API_KEY": "sk-..."}],
    )


class CreateSessionResponse(BaseModel):
    session_id: str
    status: str = Field(examples=["ready"])


class ChatHistoryMessage(BaseModel):
    model_config = ConfigDict(extra="allow")

    role: str = Field(description="Turn role, e.g. user, assistant, human, ai.")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        description="User message to send to the agent.",
    )
    history: list[ChatHistoryMessage] = Field(
        default_factory=list,
        description="Previous conversation turns.",
    )


class ChatStreamEvent(BaseModel):
    """JSON payload of one SSE `data:` frame from the chat proxy."""

    type: Literal["token", "done", "error"]
    content: str | None = None


class SessionStatusResponse(BaseModel):
    session_id: str
    agent_id: str
    framework: str
    status: Literal["healthy", "unhealthy"]
    created_at: datetime
    last_activity: datetime


class DeleteSessionResponse(BaseModel):
    session_id: str
    status: str = Field(examples=["destroyed"])


CHAT_STREAM_RESPONSES: dict[int | str, dict] = {
    200: {
        "description": (
            "Server-sent events stream. Each `data:` line is a JSON "
            "`ChatStreamEvent` (`token`, `done`, or `error`)."
        ),
        "content": {
            "text/event-stream": {
                "schema": ChatStreamEvent.model_json_schema(),
            }
        },
    },
    401: {
        "model": HTTPExceptionResponse,
        "description": "Missing or invalid auth session",
    },
    404: {
        "model": HTTPExceptionResponse,
        "description": "Session not found",
    },
}

SESSION_NOT_FOUND = {
    401: {
        "model": HTTPExceptionResponse,
        "description": "Missing or invalid auth session",
    },
    404: {"model": HTTPExceptionResponse, "description": "Session not found"},
}

CREATE_SESSION_ERRORS = {
    401: {
        "model": HTTPExceptionResponse,
        "description": "Missing or invalid auth session",
    },
    400: {
        "model": HTTPExceptionResponse,
        "description": "Missing required env vars or invalid registry path",
    },
    404: {
        "model": HTTPExceptionResponse,
        "description": "Agent or framework not found in registry",
    },
    502: {
        "model": HTTPExceptionResponse,
        "description": "Sandbox or agent HTTP error",
    },
    504: {
        "model": HTTPExceptionResponse,
        "description": "Agent did not become healthy in time",
    },
}
