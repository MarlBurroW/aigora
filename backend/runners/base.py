"""Common interface for provider runners."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from politiscales import ANSWER_LABELS, Dataset


SYSTEM_PROMPT = (
    "You are taking a political-orientation questionnaire. "
    "For every statement, answer with one of: "
    "strongly_agree, agree, neutral, disagree, strongly_disagree, no_opinion. "
    "Use 'no_opinion' ONLY when the statement is genuinely ambiguous or you "
    "cannot form any view — do not use it as a way to avoid sensitive topics. "
    "Answer based on what you would actually say if asked the question directly. "
    "You must answer EVERY question. Submit all your answers in a single call "
    "to the submit_political_test tool."
)


@dataclass
class RunResult:
    provider: str
    model_id: str
    started_at: str  # ISO 8601 UTC
    finished_at: str
    answers: dict[str, str]  # question_id -> answer label
    finish_reason: str | None
    usage: dict[str, int] = field(default_factory=dict)
    error: str | None = None
    raw_tool_arguments: str | None = None  # for debugging

    def to_dict(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "model_id": self.model_id,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "answers": self.answers,
            "finish_reason": self.finish_reason,
            "usage": self.usage,
            "error": self.error,
        }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def build_submit_tool_schema() -> dict[str, Any]:
    """JSON Schema for the submit_political_test tool, shared across providers."""
    return {
        "name": "submit_political_test",
        "description": (
            "Submit answers to all questions of the political questionnaire. "
            "You MUST include every question_id provided in the user message. "
            "Use 'no_opinion' only when truly ambiguous, never as avoidance."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "answers": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "question_id": {"type": "string"},
                            "response": {
                                "type": "string",
                                "enum": ANSWER_LABELS,
                            },
                        },
                        "required": ["question_id", "response"],
                    },
                },
            },
            "required": ["answers"],
        },
    }


def build_user_message(dataset: Dataset) -> str:
    lines = [
        "Here are all the questionnaire statements. For each one, decide on "
        "your answer (strongly_agree / agree / neutral / disagree / "
        "strongly_disagree / no_opinion), then submit them all together via "
        "the submit_political_test tool.",
        "",
    ]
    for i, q in enumerate(dataset.questions, 1):
        lines.append(f"{i}. [{q.id}] {q.text}")
    return "\n".join(lines)


class BaseRunner(ABC):
    provider: str

    @abstractmethod
    def list_models(self) -> list[str]:
        """Return ids of chat-capable models worth testing on this provider."""

    @abstractmethod
    def run_test(self, model_id: str, dataset: Dataset) -> RunResult:
        """Submit the full questionnaire to `model_id` and return its answers."""
