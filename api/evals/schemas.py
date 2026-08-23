"""Pydantic models for eval suite definitions, requests, and results."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

# -------- Type aliases --------

EvaluatorType = Literal["contains", "exact_match", "regex", "latency", "llm_judge"]
ProtocolType = Literal["chat"]
ScoreKind = Literal["quality", "metric"]

# -------- Runtime (protocol adapters + evaluators) --------

class AgentOutput(BaseModel):
    """Normalized output collected from an agent after running a case."""

    content: str = ""
    latency_ms: float = 0.0
    error: str | None = None
    transcript: list[dict[str, str]] = Field(default_factory=list)

class EvalScore(BaseModel):
    """Result of a single evaluator on a single case."""

    evaluator: str
    passed: bool
    score: float = Field(ge=0, le=1)
    reason: str
    details: dict[str, Any] | None = None
    kind: ScoreKind = "quality"

# -------- Suite definition (registry eval.json) --------

class EvalRunConfig(BaseModel):
    """Run-level settings shared across all cases in a suite."""

    model_config = ConfigDict(populate_by_name=True)
    timeout_ms: int = Field(
        default=30000,
        alias="timeoutMs",
        ge=1,
        description="Per-case timeout in milliseconds",
    )

class EvaluatorConfig(BaseModel):
    """Configuration for a single evaluator in the pipeline."""

    type: EvaluatorType = Field(description="Evaluator type: exact_match, contains, regex, llm_judge, latency")
    weight: float = Field(default=1.0, ge=0, description="Weight in aggregate quality scoring (ignored for metric evaluators)")
    config: dict[str, Any] = Field(default_factory=dict, description="Evaluator-specific settings")

class CaseExpected(BaseModel):
    """Flattened per-case assertions. Suite evaluators skip a case when their field is absent."""

    model_config = ConfigDict(extra="allow")
    output: str | None = Field(default=None, description="Expected output text (exact_match)")
    contains: list[str] | None = Field(default=None, description="Keywords that must appear in the output")
    pattern: str | None = Field(default=None, description="Regex the output must match")
    criteria: str | None = Field(default=None, description="LLM-judge rubric")

class EvalCase(BaseModel):
    """A single test case within an eval suite."""

    id: str = Field(description="Unique identifier for this case")
    name: str = Field(description="Human-readable case name")
    input: dict[str, Any] = Field(description="Input payload sent to the agent (protocol-specific)")
    expected: CaseExpected = Field(
        default_factory=CaseExpected,
        description="Flattened expected assertions (output, contains, pattern, criteria)",
    )
    tags: list[str] = Field(default_factory=list)

class EvalSuite(BaseModel):
    """Eval definition matching a registry agent's eval.json."""

    model_config = ConfigDict(populate_by_name=True)
    protocol: ProtocolType = Field(default="chat", description="Agent protocol")
    eval_config: EvalRunConfig = Field(
        default_factory=EvalRunConfig,
        alias="evalConfig",
    )
    evaluators: list[EvaluatorConfig] = Field(
        min_length=1,
        description="At least one evaluator is required",
    )
    cases: list[EvalCase] = Field(
        min_length=1,
        description="At least one test case is required",
    )

# -------- API request / response --------

class RunEvalRequest(BaseModel):
    suite: EvalSuite = Field(description="Eval suite definition (loaded client-side from registry eval.json)")
    env: dict[str, str] = Field(default_factory=dict, description="Environment variables (e.g. API keys)")

class EvalCaseResult(BaseModel):
    case_id: str
    case_name: str
    passed: bool
    score: float = Field(ge=0, le=1)
    input: dict[str, Any] | None = None
    output: str | None = None
    expected: dict[str, Any] | None = None
    transcript: list[dict[str, str]] | None = None
    latency_ms: float | None = None
    error: str | None = None
    scores: list[EvalScore] = Field(default_factory=list)

class EvalRunSummary(BaseModel):
    run_id: str
    agent_id: str
    framework: str
    status: Literal["completed"] = "completed"
    total_cases: int
    passed: int = 0
    failed: int = 0
    avg_score: float = 0.0
    started_at: datetime | None = None
    completed_at: datetime | None = None
    elapsed_ms: float | None = None
    results: list[EvalCaseResult] = Field(default_factory=list)

# -------- SSE streaming events --------

class EvalStreamEvent(BaseModel):
    """One SSE frame emitted during an eval run."""

    type: Literal[
        "case_start",
        "case_result",
        "suite_complete",
        "error",
    ]
    data: dict[str, Any] = Field(default_factory=dict)

