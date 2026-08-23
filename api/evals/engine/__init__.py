"""Eval run engine — case execution, scoring, and session lifecycle."""

from evals.engine.case_runner import run_case
from evals.engine.scoring import aggregate_quality, assertion_present, evaluator_applies
from evals.engine.session_scope import eval_session

__all__ = [
    "aggregate_quality",
    "assertion_present",
    "eval_session",
    "evaluator_applies",
    "run_case",
]
