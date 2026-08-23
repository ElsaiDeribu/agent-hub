"""Evaluator: checks if agent output contains expected keywords."""

from __future__ import annotations

from evals.schemas import EvalScore
from .base import EvalContext, Evaluator, fail_closed
from .registry import register


@register("contains")
class ContainsEvaluator(Evaluator):
    required_field = "contains"

    async def evaluate(self, ctx: EvalContext) -> EvalScore:
        keywords = ctx.expected.get("contains")
        if not isinstance(keywords, list) or not keywords:
            return fail_closed("contains", "contains")

        keywords = [str(k) for k in keywords]
        text = ctx.content.lower()
        found = [k for k in keywords if k.lower() in text]
        score = len(found) / len(keywords)
        threshold = self.config.get("threshold", 1.0)
        passed = score >= threshold
        missing = [k for k in keywords if k.lower() not in text]

        return EvalScore(
            evaluator="contains",
            passed=passed,
            score=score,
            reason=(
                f"Found {len(found)}/{len(keywords)} keywords"
                + (f"; missing: {missing}" if missing else "")
            ),
        )
