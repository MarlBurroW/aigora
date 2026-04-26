"""Anthropic provider runner — forced tool-use, one-shot answers."""

from __future__ import annotations

import json
import os
import re

import anthropic

from politiscales import Dataset

from .base import (
    SYSTEM_PROMPT,
    BaseRunner,
    RunResult,
    build_submit_tool_schema,
    build_user_message,
    now_iso,
)

# Anthropic's models endpoint already returns only chat-capable Claude models,
# but we still drop deprecated/legacy snapshots and non-frontier tiers.
_EXCLUDE = re.compile(r"(claude-1|claude-2|claude-instant)")


class AnthropicRunner(BaseRunner):
    provider = "anthropic"

    def __init__(self, api_key: str | None = None):
        self.client = anthropic.Anthropic(
            api_key=api_key or os.environ["ANTHROPIC_API_KEY"]
        )

    def list_models(self) -> list[str]:
        page = self.client.models.list(limit=1000)
        return sorted({m.id for m in page.data if not _EXCLUDE.search(m.id)})

    def run_test(self, model_id: str, dataset: Dataset) -> RunResult:
        started = now_iso()
        tool = build_submit_tool_schema()
        # Anthropic's tool format uses `input_schema` (not `parameters`)
        anthropic_tool = {
            "name": tool["name"],
            "description": tool["description"],
            "input_schema": tool["parameters"],
        }

        try:
            resp = self.client.messages.create(
                model=model_id,
                max_tokens=8192,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": build_user_message(dataset)},
                ],
                tools=[anthropic_tool],
                tool_choice={"type": "tool", "name": tool["name"]},
            )
        except Exception as e:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=now_iso(),
                answers={},
                finish_reason=None,
                error=f"{type(e).__name__}: {e}",
            )

        finished = now_iso()
        usage = {
            "prompt_tokens": resp.usage.input_tokens,
            "completion_tokens": resp.usage.output_tokens,
            "total_tokens": resp.usage.input_tokens + resp.usage.output_tokens,
        }

        # Find the tool_use block in response.content
        tool_inputs: dict | None = None
        for block in resp.content:
            if getattr(block, "type", None) == "tool_use" and block.name == tool["name"]:
                tool_inputs = block.input
                break

        if tool_inputs is None:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=finished,
                answers={},
                finish_reason=resp.stop_reason,
                usage=usage,
                error="model did not call submit_political_test",
            )

        try:
            answers = {a["question_id"]: a["response"] for a in tool_inputs["answers"]}
        except Exception as e:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=finished,
                answers={},
                finish_reason=resp.stop_reason,
                usage=usage,
                error=f"failed to parse tool inputs: {e}",
                raw_tool_arguments=json.dumps(tool_inputs),
            )

        expected = {q.id for q in dataset.questions}
        missing = expected - answers.keys()
        extra = answers.keys() - expected
        err: str | None = None
        if missing or extra:
            err = (
                f"answer set mismatch: missing={sorted(missing)[:5]}... "
                f"({len(missing)} total), extra={sorted(extra)[:5]}... "
                f"({len(extra)} total)"
            )

        return RunResult(
            provider=self.provider,
            model_id=model_id,
            started_at=started,
            finished_at=finished,
            answers=answers,
            finish_reason=resp.stop_reason,
            usage=usage,
            error=err,
            raw_tool_arguments=json.dumps(tool_inputs) if err else None,
        )
