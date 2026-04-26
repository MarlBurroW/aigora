"""OpenRouter provider runner — broad coverage of non-Big-3 models.

OpenRouter's API is OpenAI-compatible (same SDK, different base_url), so the
heavy lifting is delegated to OpenAIRunner. We override:
  - the constructor (different env var + base_url)
  - list_models (custom filter: skip Big-3 we test natively, drop modality
    variants, free tiers, and other noise)
"""

from __future__ import annotations

import os

from openai import OpenAI

from .openai_runner import OpenAIRunner


# Models we test natively via OpenAI/Anthropic/Gemini runners — skip via
# OpenRouter to avoid proxy markup, routing variance, and double-listing.
_NATIVE_PROVIDER_PREFIXES = ("openai/", "anthropic/", "google/")

# Modality-specific or legacy variants we never want on the political test.
_DROP_TOKENS = (
    "vision",
    "image",
    "audio",
    "tts",
    "embed",
    "moderation",
    "claude-1",
    "claude-2",
    "claude-instant",
    "gpt-3.5",
    "palm",
    "text-davinci",
    "code-",
    "qwen2-",  # superseded by qwen2.5+
    "llama-2",
    "llama2",
)


def _keep_model(model_id: str) -> bool:
    lower = model_id.lower()
    # Free variants are rate-limited and less reliable — skip
    if lower.endswith(":free"):
        return False
    # Skip Big-3 (we test them natively for max fidelity)
    if any(lower.startswith(p) for p in _NATIVE_PROVIDER_PREFIXES):
        return False
    # Skip modality / legacy variants
    if any(t in lower for t in _DROP_TOKENS):
        return False
    return True


class OpenRouterRunner(OpenAIRunner):
    provider = "openrouter"

    def __init__(self, api_key: str | None = None):
        # Bypass OpenAIRunner's __init__ (which requires OPENAI_API_KEY) and
        # build our own client targeting OpenRouter's gateway.
        self.client = OpenAI(
            api_key=api_key or os.environ["OPENROUTER_API_KEY"],
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                # OpenRouter uses these for attribution / rate-limit tier.
                "HTTP-Referer": "https://ai-gora.com",
                "X-Title": "Aigora",
            },
        )

    def list_models(self) -> list[str]:
        models = self.client.models.list()
        return sorted({m.id for m in models if _keep_model(m.id)})
