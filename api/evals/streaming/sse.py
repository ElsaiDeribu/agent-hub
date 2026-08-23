"""SSE formatting helpers for eval run streaming."""

from evals.schemas import EvalStreamEvent


def format_sse(event: EvalStreamEvent) -> str:
    """Format an EvalStreamEvent as an SSE data line."""
    return f"data: {event.model_dump_json()}\n\n"
