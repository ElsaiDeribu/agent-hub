"""Base protocol adapter interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from evals.schemas import AgentOutput


class ProtocolAdapter(ABC):
    """Translates between eval orchestrator format and agent HTTP API."""

    @abstractmethod
    async def send(self, port: int, case_input: dict[str, Any]) -> AgentOutput:
        """Send eval input to the agent and collect its output."""
