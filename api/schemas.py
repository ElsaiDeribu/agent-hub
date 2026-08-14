"""Pydantic request/response models for registry, session, and health routes."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    microsandbox_installed: bool
    active_sessions: int = Field(ge=0)


class RegistryPackage(BaseModel):
    """One `registry/<agent>/<framework>/` package (from metadata.json)."""

    model_config = ConfigDict(extra="allow")

    id: str
    name: str
    description: str = ""
    category: str = ""
    tags: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    framework: str | None = Field(
        default=None,
        description="Selected framework package name (set when listing or fetching one package).",
    )
    entrypoint: str = "_preview.ts"
    dependencies: list[str] = Field(default_factory=list)
    env: list[str] = Field(
        default_factory=list,
        description="Required environment variable names.",
    )
    files: list[str] = Field(default_factory=list)
    welcomeMessage: str = ""
    starterMessages: list[str] = Field(default_factory=list)


class RegistryAgentDetail(BaseModel):
    """All framework packages for a registry agent."""

    id: str
    frameworks: list[str]
    packages: list[RegistryPackage]


class RegistryPreviewRequest(BaseModel):
    framework: str = Field(
        min_length=1,
        max_length=64,
        description="Framework package under registry/<agent>/<framework>/.",
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


class SessionSummary(BaseModel):
    session_id: str
    agent_id: str
    framework: str
    host_port: int
    created_at: datetime
    last_activity: datetime


class DeleteSessionResponse(BaseModel):
    session_id: str
    status: str = Field(examples=["destroyed"])


class HTTPExceptionResponse(BaseModel):
    detail: str


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
    404: {
        "model": HTTPExceptionResponse,
        "description": "Session not found",
    },
}

SESSION_NOT_FOUND = {
    404: {"model": HTTPExceptionResponse, "description": "Session not found"},
}

CREATE_SESSION_ERRORS = {
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

REGISTRY_NOT_FOUND = {
    404: {"model": HTTPExceptionResponse, "description": "Agent not found in registry"},
}
