"""Postgres persistence layer.

The schema lives in ../db/schema.sql (source of truth, applied at DB init).
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

import psycopg

from runners.base import RunResult


@contextmanager
def get_conn() -> Iterator[psycopg.Connection]:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. For local dev: "
            "postgresql://politix:politix_local_dev@localhost:5432/politix"
        )
    with psycopg.connect(url) as conn:
        yield conn


def list_seen_models(conn: psycopg.Connection, provider: str) -> set[str]:
    cur = conn.execute(
        "SELECT model_id FROM models WHERE provider = %s",
        (provider,),
    )
    return {row[0] for row in cur.fetchall()}


def upsert_model(conn: psycopg.Connection, provider: str, model_id: str) -> None:
    conn.execute(
        "INSERT INTO models (provider, model_id) VALUES (%s, %s) "
        "ON CONFLICT DO NOTHING",
        (provider, model_id),
    )


def insert_run(
    conn: psycopg.Connection,
    result: RunResult,
    scores: dict[str, float],
) -> int:
    """Persist a run + its answers + computed scores. Returns the run id."""
    upsert_model(conn, result.provider, result.model_id)

    row = conn.execute(
        """
        INSERT INTO runs (
            provider, model_id, started_at, finished_at, finish_reason,
            prompt_tokens, completion_tokens, total_tokens, error
        ) VALUES (%s, %s, %s::timestamptz, %s::timestamptz, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            result.provider,
            result.model_id,
            result.started_at,
            result.finished_at,
            result.finish_reason,
            result.usage.get("prompt_tokens", 0),
            result.usage.get("completion_tokens", 0),
            result.usage.get("total_tokens", 0),
            result.error,
        ),
    ).fetchone()
    assert row is not None
    run_id = row[0]

    if result.answers:
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO answers (run_id, question_id, response) "
                "VALUES (%s, %s, %s)",
                [(run_id, qid, ans) for qid, ans in result.answers.items()],
            )

    if scores:
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO scores (run_id, axis, score) VALUES (%s, %s, %s)",
                [(run_id, axis, float(score)) for axis, score in scores.items()],
            )

    conn.commit()
    return run_id
