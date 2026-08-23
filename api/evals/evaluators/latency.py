"""Evaluator: records agent response latency as a metric (does not affect pass/fail)."""

from __future__ import annotations

from evals.schemas import EvalScore
from .base import EvalContext, Evaluator
from .registry import register


@register("latency")
class LatencyEvaluator(Evaluator):
    kind = "metric"

    async def evaluate(self, ctx: EvalContext) -> EvalScore:
        max_ms = self.config.get("maxMs")
        if max_ms is None:
            return EvalScore(
                evaluator="latency",
                passed=False,
                score=0.0,
                reason="Missing config.maxMs",
                kind="metric",
            )

        try:
            limit = float(max_ms)
        except (TypeError, ValueError):
            return EvalScore(
                evaluator="latency",
                passed=False,
                score=0.0,
                reason="Invalid config.maxMs",
                kind="metric",
            )

        actual_ms = ctx.output.latency_ms
        within = actual_ms <= limit

        return EvalScore(
            evaluator="latency",
            passed=within,
            score=1.0 if within else 0.0,
            reason=f"{actual_ms:.0f}ms (limit: {limit:.0f}ms)",
            details={"latency_ms": round(actual_ms, 1), "max_ms": limit},
            kind="metric",
        )
