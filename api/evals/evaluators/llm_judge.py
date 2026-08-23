"""Evaluator: uses an LLM to judge agent output quality."""

from __future__ import annotations

import json
import os

import httpx

from evals.schemas import EvalScore
from .base import EvalContext, Evaluator, fail_closed
from .registry import register

_JUDGE_SYSTEM = """You are an eval judge. You evaluate AI agent outputs against specific criteria.

You are given the original input (or full conversation transcript), an optional expected output, the agent's actual output, and scoring criteria.

Respond ONLY with a JSON object containing:
- "score": integer from 0-10 (0=completely wrong, 10=perfect)
- "reasoning": brief explanation (1-2 sentences)

Example: {"score": 8, "reasoning": "Response correctly answers the question with relevant detail."}"""


def _format_input(ctx: EvalContext) -> str:
    transcript = ctx.format_transcript()
    raw_input = json.dumps(ctx.input, ensure_ascii=False, indent=2)
    if transcript.strip() and transcript != "(empty)":
        return f"{transcript}\n\n## Raw Input\n{raw_input}"
    return raw_input


@register("llm_judge")
class LLMJudgeEvaluator(Evaluator):
    required_field = "criteria"

    async def evaluate(self, ctx: EvalContext) -> EvalScore:
        criteria = ctx.expected.get("criteria")
        if not isinstance(criteria, str) or not criteria.strip():
            return fail_closed("llm_judge", "criteria")

        api_key = (
            self.config.get("OPENAI_API_KEY")
            or self.config.get("api_key")
            or os.environ.get("OPENAI_API_KEY", "")
        )
        model = self.config.get("model", "gpt-4o-mini")

        if not api_key:
            return EvalScore(
                evaluator="llm_judge",
                passed=False,
                score=0.0,
                reason="No OPENAI_API_KEY provided. Please enter your API key in the eval form.",
            )

        expected_output = ctx.expected.get("output")
        expected_block = (
            f"## Expected Output\n{expected_output}\n\n"
            if isinstance(expected_output, str) and expected_output.strip()
            else ""
        )

        user_prompt = (
            f"## Evaluation Criteria\n{criteria.strip()}\n\n"
            f"## Conversation\n{_format_input(ctx)}\n\n"
            f"{expected_block}"
            f"## Agent Output\n{ctx.content}\n\n"
            "Score the output 0-10 based on the criteria above. "
            "Judge against the conversation, not the final reply in isolation."
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": _JUDGE_SYSTEM},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0,
                        "max_tokens": 200,
                    },
                )
                resp.raise_for_status()
                body = resp.json()

            content = body["choices"][0]["message"]["content"]
            judgment = json.loads(content)
            score_raw = int(judgment.get("score", 0))
            reasoning = judgment.get("reasoning", "")

            score = max(0, min(score_raw, 10)) / 10
            threshold = self.config.get("threshold", 0.7)
            passed = score >= threshold

            return EvalScore(
                evaluator="llm_judge",
                passed=passed,
                score=round(score, 2),
                reason=reasoning,
                details={"raw_score": score_raw, "model": model},
            )

        except (httpx.HTTPError, json.JSONDecodeError, KeyError) as exc:
            return EvalScore(
                evaluator="llm_judge",
                passed=False,
                score=0.0,
                reason=f"LLM judge failed: {exc}",
            )
