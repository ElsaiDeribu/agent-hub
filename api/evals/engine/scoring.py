"""Quality score aggregation and evaluator applicability checks."""

from __future__ import annotations

from typing import Any

from evals.evaluators.base import Evaluator
from evals.schemas import EvalScore, EvaluatorConfig


def assertion_present(value: Any) -> bool:
    """True when a per-case expected field is usable (non-empty string or list)."""
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return len(value) > 0
    return True


def evaluator_applies(evaluator: Evaluator, expected: dict[str, Any]) -> bool:
    if evaluator.required_field is None:
        return True
    return assertion_present(expected.get(evaluator.required_field))


def aggregate_quality(
    scores: list[EvalScore],
    configs: list[EvaluatorConfig],
) -> tuple[bool, float]:
    """Pass/score from quality evaluators only. Metric scores are recorded but ignored."""
    quality = [
        (score, cfg)
        for score, cfg in zip(scores, configs)
        if score.kind == "quality"
    ]
    if not quality:
        return True, 1.0

    all_passed = all(score.passed for score, _ in quality)
    total_weight = sum(cfg.weight for _, cfg in quality)
    weighted = sum(
        score.score * cfg.weight for score, cfg in quality
    ) / max(total_weight, 0.001)
    return all_passed, round(weighted, 3)
