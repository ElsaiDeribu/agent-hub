"""Eval orchestrator — coordinates sandbox, protocol adapters, and evaluators."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from uuid import uuid4

from sessions.manager import SessionManager

from evals.engine.case_runner import run_case
from evals.engine.session_scope import eval_session
from evals.protocols import get_protocol_adapter
from evals.schemas import (
    EvalCase,
    EvalRunConfig,
    EvalRunSummary,
    EvalStreamEvent,
    EvaluatorConfig,
)
from evals.streaming.sse import format_sse


async def run_eval_suite(
    manager: SessionManager,
    agent_id: str,
    framework: str,
    env: dict[str, str],
    protocol: str,
    eval_config: EvalRunConfig,
    evaluator_configs: list[EvaluatorConfig],
    cases: list[EvalCase],
) -> AsyncGenerator[str, None]:
    """Run a full eval suite, yielding SSE data lines as results come in."""
    run_id = uuid4().hex[:12]
    started_at = datetime.now(timezone.utc)
    prefix = f"[eval {run_id}]"

    passed_count = 0
    failed_count = 0
    total_score = 0.0
    results = []

    try:
        async with eval_session(manager, agent_id, framework, env, prefix) as session:
            adapter = get_protocol_adapter(protocol)

            print(f"{prefix} Running {len(cases)} eval case(s)")
            for i, case in enumerate(cases):
                yield format_sse(EvalStreamEvent(
                    type="case_start",
                    data={"case_id": case.id, "case_name": case.name, "index": i},
                ))

                case_result = await run_case(
                    adapter=adapter,
                    port=session.host_port,
                    case=case,
                    env=env,
                    evaluator_configs=evaluator_configs,
                    timeout_ms=eval_config.timeout_ms,
                )

                if case_result.passed:
                    passed_count += 1
                else:
                    failed_count += 1
                total_score += case_result.score

                results.append(case_result)
                yield format_sse(EvalStreamEvent(
                    type="case_result",
                    data=case_result.model_dump(),
                ))

            print(
                f"{prefix} Evals complete: {passed_count} passed, "
                f"{failed_count} failed"
            )
    except Exception as exc:
        print(f"{prefix} Failed to create session/sandbox: {exc}")
        yield format_sse(EvalStreamEvent(
            type="error",
            data={"message": f"Failed to start sandbox: {exc}", "run_id": run_id},
        ))
        return

    completed_at = datetime.now(timezone.utc)
    summary = EvalRunSummary(
        run_id=run_id,
        agent_id=agent_id,
        framework=framework,
        total_cases=len(cases),
        passed=passed_count,
        failed=failed_count,
        avg_score=round(total_score / max(len(cases), 1), 3),
        started_at=started_at,
        completed_at=completed_at,
        elapsed_ms=round((completed_at - started_at).total_seconds() * 1000, 1),
        results=results,
    )

    yield format_sse(EvalStreamEvent(
        type="suite_complete",
        data=summary.model_dump(mode="json", exclude={"results"}),
    ))
