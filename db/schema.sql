-- Source of truth for the database schema.
-- Applied automatically on first boot via docker-entrypoint-initdb.d (local dev)
-- and via a one-shot K8s Job (production).

CREATE TABLE IF NOT EXISTS models (
    provider      TEXT NOT NULL,
    model_id      TEXT NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (provider, model_id)
);

CREATE TABLE IF NOT EXISTS runs (
    id                BIGSERIAL PRIMARY KEY,
    provider          TEXT NOT NULL,
    model_id          TEXT NOT NULL,
    started_at        TIMESTAMPTZ NOT NULL,
    finished_at       TIMESTAMPTZ NOT NULL,
    finish_reason     TEXT,
    prompt_tokens     INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens      INT NOT NULL DEFAULT 0,
    error             TEXT,
    FOREIGN KEY (provider, model_id) REFERENCES models(provider, model_id)
);

CREATE INDEX IF NOT EXISTS idx_runs_model ON runs(provider, model_id);
CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at DESC);

CREATE TABLE IF NOT EXISTS answers (
    run_id      BIGINT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    response    TEXT NOT NULL CHECK (response IN (
        'strongly_agree','agree','neutral','disagree','strongly_disagree','no_opinion'
    )),
    PRIMARY KEY (run_id, question_id)
);

CREATE TABLE IF NOT EXISTS scores (
    run_id BIGINT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    axis   TEXT NOT NULL,
    score  NUMERIC(6,3) NOT NULL,
    PRIMARY KEY (run_id, axis)
);
