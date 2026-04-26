"""Google Gemini provider runner — forced function calling, one-shot answers."""

from __future__ import annotations

import json
import os
import re

from google import genai
from google.genai import types as gtypes

from politiscales import Dataset

from .base import (
    SYSTEM_PROMPT,
    BaseRunner,
    RunResult,
    build_submit_tool_schema,
    build_user_message,
    now_iso,
)


# Strip the "models/" prefix that Gemini returns on listing
_PREFIX = "models/"
# Drop modality-specific or legacy / experimental variants we don't need
_EXCLUDE = re.compile(
    r"(embedding|aqa|tts|vision|imagen|veo|learnlm|exp|tuning|gecko|"
    r"text-bison|chat-bison|tts|live)"
)
_INCLUDE = re.compile(r"^gemini-")

_GEMINI_UNSUPPORTED = {"additionalProperties", "$schema", "definitions", "$ref"}


def _strip_for_gemini(schema: dict) -> dict:
    """Recursively drop JSON-Schema fields the Gemini API doesn't accept."""
    if not isinstance(schema, dict):
        return schema
    out = {}
    for k, v in schema.items():
        if k in _GEMINI_UNSUPPORTED:
            continue
        if isinstance(v, dict):
            out[k] = _strip_for_gemini(v)
        elif isinstance(v, list):
            out[k] = [_strip_for_gemini(x) if isinstance(x, dict) else x for x in v]
        else:
            out[k] = v
    return out


class GeminiRunner(BaseRunner):
    provider = "gemini"

    def __init__(self, api_key: str | None = None):
        self.client = genai.Client(api_key=api_key or os.environ["GOOGLE_API_KEY"])

    def list_models(self) -> list[str]:
        ids: set[str] = set()
        for m in self.client.models.list():
            name = m.name or ""
            short = name.removeprefix(_PREFIX)
            if not _INCLUDE.match(short):
                continue
            if _EXCLUDE.search(short):
                continue
            # Only keep models that support generateContent (chat)
            if m.supported_actions and "generateContent" not in m.supported_actions:
                continue
            ids.add(short)
        return sorted(ids)

    def run_test(self, model_id: str, dataset: Dataset) -> RunResult:
        started = now_iso()
        tool = build_submit_tool_schema()

        # Gemini rejects `additionalProperties` and other JSON-Schema-only
        # keywords; strip them recursively before sending.
        fn_decl = gtypes.FunctionDeclaration(
            name=tool["name"],
            description=tool["description"],
            parameters=_strip_for_gemini(tool["parameters"]),
        )
        gemini_tool = gtypes.Tool(function_declarations=[fn_decl])

        config = gtypes.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[gemini_tool],
            tool_config=gtypes.ToolConfig(
                function_calling_config=gtypes.FunctionCallingConfig(
                    mode="ANY",
                    allowed_function_names=[tool["name"]],
                )
            ),
        )

        try:
            resp = self.client.models.generate_content(
                model=model_id,
                contents=build_user_message(dataset),
                config=config,
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
        usage_meta = getattr(resp, "usage_metadata", None)
        usage = {
            "prompt_tokens": getattr(usage_meta, "prompt_token_count", 0) or 0,
            "completion_tokens": getattr(usage_meta, "candidates_token_count", 0) or 0,
            "total_tokens": getattr(usage_meta, "total_token_count", 0) or 0,
        }

        # Walk the response parts looking for the function call
        fn_args: dict | None = None
        finish_reason: str | None = None
        for cand in resp.candidates or []:
            finish_reason = str(cand.finish_reason) if cand.finish_reason else None
            for part in (cand.content.parts if cand.content else []) or []:
                fc = getattr(part, "function_call", None)
                if fc and fc.name == tool["name"]:
                    fn_args = dict(fc.args) if fc.args else {}
                    break
            if fn_args is not None:
                break

        if fn_args is None:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=finished,
                answers={},
                finish_reason=finish_reason,
                usage=usage,
                error="model did not call submit_political_test",
            )

        try:
            raw_answers = fn_args.get("answers", [])
            answers = {a["question_id"]: a["response"] for a in raw_answers}
        except Exception as e:
            return RunResult(
                provider=self.provider,
                model_id=model_id,
                started_at=started,
                finished_at=finished,
                answers={},
                finish_reason=finish_reason,
                usage=usage,
                error=f"failed to parse function call args: {e}",
                raw_tool_arguments=json.dumps(fn_args, default=str),
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
            finish_reason=finish_reason,
            usage=usage,
            error=err,
            raw_tool_arguments=json.dumps(fn_args, default=str) if err else None,
        )
