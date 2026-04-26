"""CLI orchestrator: discover provider models, run the test on new ones,
persist results to Postgres.

Usage:
    python run_test.py --provider openai                     # all new models
    python run_test.py --provider openai --model gpt-4o-mini # one specific model
    python run_test.py --provider openai --list              # list, exit
    python run_test.py --provider openai --force             # re-run all
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv

import db
from politiscales import compute_scores, load_dataset
from runners import (
    AnthropicRunner,
    GeminiRunner,
    OpenAIRunner,
    OpenRouterRunner,
)
from runners.base import BaseRunner, RunResult

REPO_ROOT = Path(__file__).resolve().parent

PROVIDERS: dict[str, type[BaseRunner]] = {
    "openai": OpenAIRunner,
    "anthropic": AnthropicRunner,
    "gemini": GeminiRunner,
    "openrouter": OpenRouterRunner,
}


def run_for_model(runner: BaseRunner, model_id: str, dataset, conn) -> RunResult:
    print(f"  → running {runner.provider}/{model_id} ...", flush=True)
    result = runner.run_test(model_id, dataset)
    if result.error and not result.answers:
        print(f"    FAILED: {result.error}")
        # Still persist the failed attempt so we know we tried
        db.insert_run(conn, result, {})
        return result
    try:
        scores = compute_scores(result.answers, dataset)
    except Exception as e:
        # Last-resort safety net — `compute_scores` is meant to be tolerant,
        # but if something unexpected slips through we still want the raw
        # answers persisted for inspection.
        print(f"    WARNING: scoring failed ({e}); persisting answers only")
        scores = {}
        if not result.error:
            result.error = f"scoring failed: {e}"
    run_id = db.insert_run(conn, result, scores)
    n_answered = sum(1 for v in result.answers.values() if v != "no_opinion")
    n_skipped = sum(1 for v in result.answers.values() if v == "no_opinion")
    tokens = result.usage.get("total_tokens", 0)
    note = f" [warn: {result.error}]" if result.error else ""
    print(
        f"    OK: run_id={run_id}, {len(result.answers)} answers "
        f"({n_answered} answered, {n_skipped} no_opinion), {tokens} tokens{note}"
    )
    return result


def main() -> int:
    load_dotenv(REPO_ROOT.parent / ".env")

    p = argparse.ArgumentParser()
    p.add_argument("--provider", required=True, choices=PROVIDERS.keys())
    p.add_argument("--model", help="run a single model id (skips discovery)")
    p.add_argument("--list", action="store_true", help="list discovered models, exit")
    p.add_argument(
        "--force",
        action="store_true",
        help="re-run models already present in the DB",
    )
    args = p.parse_args()

    runner = PROVIDERS[args.provider]()
    dataset = load_dataset()

    with db.get_conn() as conn:
        if args.model:
            targets = [args.model]
        else:
            print(f"Discovering {args.provider} models...")
            all_models = runner.list_models()
            print(f"  → {len(all_models)} chat-capable models discovered")
            if args.list:
                seen = db.list_seen_models(conn, args.provider)
                for m in all_models:
                    mark = " [seen]" if m in seen else ""
                    print(f"    - {m}{mark}")
                return 0
            seen = db.list_seen_models(conn, args.provider)
            targets = (
                all_models if args.force else [m for m in all_models if m not in seen]
            )
            if not targets:
                print("  → no new models to test (use --force to re-run)")
                return 0
            print(f"  → {len(targets)} new model(s) to test:")
            for m in targets:
                print(f"    - {m}")

        for model_id in targets:
            run_for_model(runner, model_id, dataset, conn)

    return 0


if __name__ == "__main__":
    sys.exit(main())
