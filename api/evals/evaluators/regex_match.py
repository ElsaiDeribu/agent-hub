"""Evaluator: checks if agent output matches a regex pattern."""

from __future__ import annotations

import re

from evals.schemas import EvalScore
from .base import EvalContext, Evaluator, fail_closed
from .registry import register


@register("regex")
class RegexMatchEvaluator(Evaluator):
    required_field = "pattern"

    async def evaluate(self, ctx: EvalContext) -> EvalScore:
        pattern = ctx.expected.get("pattern")
        if not isinstance(pattern, str) or not pattern:
            return fail_closed("regex", "pattern")

        flags = re.IGNORECASE if self.config.get("case_insensitive", True) else 0
        try:
            match = re.search(pattern, ctx.content, flags)
        except re.error as exc:
            return EvalScore(
                evaluator="regex",
                passed=False,
                score=0.0,
                reason=f"Invalid regex: {exc}",
            )

        passed = match is not None
        return EvalScore(
            evaluator="regex",
            passed=passed,
            score=1.0 if passed else 0.0,
            reason=f"Pattern {'matched' if passed else 'not found'}: {pattern}",
        )
