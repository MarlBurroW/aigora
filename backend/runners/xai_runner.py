"""xAI provider runner — Grok models via the native xAI API.

xAI's API is OpenAI-compatible (same SDK, different base_url + endpoint),
so the heavy lifting is delegated to OpenAIRunner. Native testing avoids
OpenRouter routing variance for the Grok lineup specifically.
"""

from __future__ import annotations

import os
import re

from openai import OpenAI

from .openai_runner import OpenAIRunner


_INCLUDE = re.compile(r"^grok-")
# Skip modality- / coding-specific variants we don't want on the political
# test (the questionnaire is plain English text).
_EXCLUDE = re.compile(r"(vision|image|audio|code-fast)")


class XAIRunner(OpenAIRunner):
    provider = "xai"

    def __init__(self, api_key: str | None = None):
        # Bypass OpenAIRunner's __init__ (which wants OPENAI_API_KEY) and
        # build a client targeting xAI's gateway.
        self.client = OpenAI(
            api_key=api_key or os.environ["XAI_API_KEY"],
            base_url="https://api.x.ai/v1",
        )

    def list_models(self) -> list[str]:
        models = self.client.models.list()
        return sorted(
            {
                m.id
                for m in models
                if _INCLUDE.match(m.id) and not _EXCLUDE.search(m.id)
            }
        )
