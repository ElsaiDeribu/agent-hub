"""Run a single eval case through a protocol adapter and evaluators."""

from __future__ import annotations

import asyncio
from typing import Any

from evals.engine.scoring import aggregate_quality, evaluator_applies
from evals.evaluators import EvalContext, Evaluator, get_evaluator
from evals.protocols.base import ProtocolAdapter
from evals.schemas import EvalCase, EvalCaseResult, EvalScore, EvaluatorConfig


async def run_case(
    adapter: ProtocolAdapter,
    port: int,
    case: EvalCase,
    env: dict[str, str],
    evaluator_configs: list[EvaluatorConfig],
    timeout_ms: int,
) -> EvalCaseResult:
    """Run a single eval case and return a typed result."""
    expected = case.expected.model_dump(exclude_none=True)
    base = dict(
        case_id=case.id,
        case_name=case.name,
        input=case.input,
        expected=expected,
    )

    try:
        output = await asyncio.wait_for(
            adapter.send(port, case.input),
            timeout=timeout_ms / 1000,
        )

        base["transcript"] = output.transcript
        base["output"] = output.content
        base["latency_ms"] = round(output.latency_ms, 1)

        if output.error:
            return EvalCaseResult(
                **base, passed=False, score=0.0, error=output.error,
            )

        ctx = EvalContext(input=case.input, output=output, expected=expected)
        scores: list[EvalScore] = []
        applied: list[EvaluatorConfig] = []
        for eval_cfg in evaluator_configs:
            evaluator_config = {**eval_cfg.config, **env}
            evaluator: Evaluator = get_evaluator(eval_cfg.type, evaluator_config)
            if not evaluator_applies(evaluator, expected):
                continue
            score = await evaluator.evaluate(ctx)
            if evaluator.kind == "metric":
                score.kind = "metric"
            applied.append(eval_cfg)
            scores.append(score)

        passed, quality_score = aggregate_quality(scores, applied)

        return EvalCaseResult(
            **base,
            passed=passed,
            score=quality_score,
            scores=scores,
        )
    except asyncio.TimeoutError:
        return EvalCaseResult(
            **base, passed=False, score=0.0, output="",
            error=f"Timeout after {timeout_ms}ms", latency_ms=timeout_ms,
        )
    except Exception as exc:
        return EvalCaseResult(
            **base, passed=False, score=0.0, output="",
            error=str(exc), latency_ms=0,
        )
