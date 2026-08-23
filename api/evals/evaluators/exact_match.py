"""Evaluator: checks exact or normalized-exact match."""

from __future__ import annotations

from evals.schemas import EvalScore
from .base import EvalContext, Evaluator, fail_closed
from .registry import register


@register("exact_match")
class ExactMatchEvaluator(Evaluator):
    required_field = "output"

    async def evaluate(self, ctx: EvalContext) -> EvalScore:
        expected_text = ctx.expected.get("output")
        if not isinstance(expected_text, str) or not expected_text.strip():
            return fail_closed("exact_match", "output")

        case_sensitive: bool = self.config.get("case_sensitive", False)

        actual = ctx.content.strip()
        target = expected_text.strip()

        if not case_sensitive:
            actual = actual.lower()
            target = target.lower()

        passed = actual == target
        return EvalScore(
            evaluator="exact_match",
            passed=passed,
            score=1.0 if passed else 0.0,
            reason=(
                "Exact match"
                if passed
                else f"Expected '{expected_text}', got '{ctx.content[:100]}'"
            ),
        )
