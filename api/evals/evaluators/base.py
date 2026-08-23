"""Base evaluator interface and context."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from evals.schemas import AgentOutput, EvalScore, ScoreKind


@dataclass
class EvalContext:
    """Full context passed to every evaluator."""

    input: dict[str, Any]
    output: AgentOutput
    expected: dict[str, Any]

    @property
    def content(self) -> str:
        return self.output.content

    @property
    def transcript(self) -> list[dict[str, str]]:
        return self.output.transcript

    def format_transcript(self) -> str:
        if not self.transcript:
            return self.content or "(empty)"
        return "\n".join(
            f"{(turn.get('role') or 'unknown').upper()}: {turn.get('content', '')}"
            for turn in self.transcript
        )


def fail_closed(evaluator: str, field: str, *, source: str = "expected") -> EvalScore:
    """Fail a quality check when a required assertion field is missing."""
    return EvalScore(
        evaluator=evaluator,
        passed=False,
        score=0.0,
        reason=f"Missing {source}.{field}",
    )


class Evaluator(ABC):
    """Base class for all evaluator plugins."""

    kind: ScoreKind = "quality"
    required_field: str | None = None

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or {}

    @abstractmethod
    async def evaluate(self, ctx: EvalContext) -> EvalScore:
        """Score the agent output using the full eval context."""
