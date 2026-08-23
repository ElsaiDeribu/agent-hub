"""Chat protocol adapter — talks to agents exposing POST /chat with SSE."""

from __future__ import annotations

import json
import time
from typing import Any

import httpx

from evals.schemas import AgentOutput

from .base import ProtocolAdapter
from .registry import register_protocol


@register_protocol("chat")
class ChatProtocolAdapter(ProtocolAdapter):
    """Handles single-turn and multi-turn chat evals."""

    async def send(self, port: int, case_input: dict[str, Any]) -> AgentOutput:
        if "turns" in case_input:
            return await self._multi_turn(port, case_input["turns"])
        return await self._single_turn(
            port,
            case_input.get("message", ""),
            case_input.get("history", []),
        )

    async def _single_turn(
        self, port: int, message: str, history: list[dict[str, str]]
    ) -> AgentOutput:
        chunks: list[str] = []
        error: str | None = None
        start = time.monotonic()

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"http://127.0.0.1:{port}/chat",
                    json={"message": message, "history": history},
                ) as response:
                    if response.is_error:
                        body = (await response.aread()).decode(errors="replace").strip()
                        detail = body[:200] if body else response.reason_phrase
                        error = f"Agent returned HTTP {response.status_code}: {detail}"
                    else:
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line.startswith("data:"):
                                continue
                            payload = line[5:].strip()
                            if not payload or payload == "[DONE]":
                                continue
                            try:
                                event = json.loads(payload)
                                if event.get("type") == "token":
                                    chunks.append(event.get("content", ""))
                                elif event.get("type") == "error":
                                    error = event.get("content", "Agent error")
                            except json.JSONDecodeError:
                                pass
        except httpx.ConnectError:
            error = "Agent is not reachable"
        except httpx.ReadTimeout:
            error = "Agent response timed out"
        except httpx.HTTPError as exc:
            error = f"Agent request failed: {exc}"

        content = "".join(chunks)
        elapsed = (time.monotonic() - start) * 1000
        transcript = [
            *history,
            {"role": "user", "content": message},
            {"role": "assistant", "content": content},
        ]
        return AgentOutput(
            content=content,
            latency_ms=elapsed,
            error=error,
            transcript=transcript,
        )

    async def _multi_turn(
        self, port: int, turns: list[dict[str, Any]]
    ) -> AgentOutput:
        """Run a sequence of turns, feeding each output into the next as history."""
        history: list[dict[str, str]] = []
        last_output = AgentOutput()
        total_latency = 0.0

        for turn in turns:
            message = turn.get("message", "")
            turn_history = history if turn.get("history") == "auto" else turn.get("history", [])

            last_output = await self._single_turn(port, message, turn_history)
            total_latency += last_output.latency_ms

            history.append({"role": "user", "content": message})
            history.append({"role": "assistant", "content": last_output.content})

            if last_output.error:
                break

        last_output.latency_ms = total_latency
        last_output.transcript = history
        return last_output
