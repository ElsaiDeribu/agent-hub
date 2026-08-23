"""API routes for the eval system."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from sessions.manager import SessionManager, get_session_manager

from evals.orchestrator import run_eval_suite
from evals.schemas import RunEvalRequest

router = APIRouter(prefix="/evals", tags=["evals"])

SessionMgr = Annotated[SessionManager, Depends(get_session_manager)]


@router.post("/{agent_id}/{framework}/run")
async def run_eval(
    agent_id: str,
    framework: str,
    req: RunEvalRequest,
    manager: SessionMgr,
) -> StreamingResponse:
    """Start an eval run. Returns SSE stream of eval progress and results."""
    suite = req.suite

    return StreamingResponse(
        run_eval_suite(
            manager=manager,
            agent_id=agent_id,
            framework=framework,
            env=req.env,
            protocol=suite.protocol,
            eval_config=suite.eval_config,
            evaluator_configs=suite.evaluators,
            cases=suite.cases,
        ),
        media_type="text/event-stream",
    )
