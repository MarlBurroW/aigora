"""OpenAI provider runner — forced tool-use, one-shot answers."""

from __future__ import annotations

import json
import os
import re
from typing import Iterable

from openai import OpenAI

from politiscales import Dataset

from .base import (
    SYSTEM_PROMPT,
    BaseRunner,
    RunResult,
    build_submit_tool_schema,
    build_user_message,
    now_iso,
)


# Conservative whitelist: keep frontier chat models, drop modality-specific
# variants and legacy completion-only models.
_INCLUDE = re.compile(r"^(gpt-[3-9]|o\d|chatgpt-)")
_EXCLUDE = re.compile(
    r"(audio|realtime|tts|transcribe|instruct|embedding|moderation|"
    r"davinci|babbage|whisper|dall-e|image|search-preview|search-api|codex)"
)
# `-pro` variants on gpt-5+ require the v1/responses endpoint, not the
# v1/chat/completions one our SDK uses, so they 404 with our request shape.
_PRO_VARIANT = re.compile(r"-pro(-|$)")


def _is_chat_model(model_id: str) -> bool:
    if not _INCLUDE.match(model_id):
        return False
    if _EXCLUDE.search(model_id):
        return False
    if _PRO_VARIANT.search(model_id):
        return False
    return True


class OpenAIRunner(BaseRunner):
    provider = "openai"

    def __init__(self, api_key: str | None = None):
        self.client = OpenAI(api_key=api_key or os.environ["OPENAI_API_KEY"])

    def list_models(self) -> list[str]:
        models = self.client.models.list()
        return sorted({m.id for m in models if _is_chat_model(m.id)})

    def run_test(self, model_id: str, dataset: Dataset) -> RunResult:
        started = now_iso()
        tool = build_submit_tool_schema()
        # OpenAI's Chat Completions tool format wraps the schema:
        oai_tool = {
            "type": "function",
            "function": {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["parameters"],
                "strict": True,
            },
        }

        try:
            resp = self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": build_user_message(dataset)},
                ],
                tools=[oai_tool],
                tool_choice={
                    "type": "function",
                    "function": {"name": tool["name"]},
                },
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
        choice = resp.choices[0]
        usage = {
            "prompt_tokens": resp.usage.prompt_tokens if resp.usage else 0,
            "completion_tokens": resp.usage.completion_tokens if resp.usage else 0,
            "total_tokens": resp.usage.total_tokens if resp.usage else 0,
        }

        tool_calls = choice.message.tool_calls or []
        if not tool_calls:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=finished,
                answers={},
                finish_reason=choice.finish_reason,
                usage=usage,
                error="model did not call submit_political_test",
            )

        raw_args = tool_calls[0].function.arguments
        try:
            payload = json.loads(raw_args)
            answers = {a["question_id"]: a["response"] for a in payload["answers"]}
        except Exception as e:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=finished,
                answers={},
                finish_reason=choice.finish_reason,
                usage=usage,
                error=f"failed to parse tool arguments: {e}",
                raw_tool_arguments=raw_args,
            )

        # Validate completeness
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
            finish_reason=choice.finish_reason,
            usage=usage,
            error=err,
            raw_tool_arguments=raw_args if err else None,
        )
