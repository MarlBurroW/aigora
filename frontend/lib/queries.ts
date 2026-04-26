import { pool } from "./db";
import type {
  AnswerLabel,
  AnswerRow,
  AxisScore,
  ModelSummary,
  Provider,
  RunDetails,
} from "./types";

/** Latest successful run per (provider, model_id), with run counts. */
export async function listModelSummaries(): Promise<ModelSummary[]> {
  const { rows } = await pool.query<{
    provider: Provider;
    model_id: string;
    latest_run_id: number;
    latest_started_at: Date;
    total_runs: string;
    total_tokens: string;
    has_error: boolean;
  }>(`
    WITH latest AS (
      SELECT DISTINCT ON (provider, model_id)
        id, provider, model_id, started_at, total_tokens, error
      FROM runs
      WHERE error IS NULL
      ORDER BY provider, model_id, started_at DESC
    ),
    counts AS (
      SELECT provider, model_id, COUNT(*) AS total_runs
      FROM runs
      WHERE error IS NULL
      GROUP BY provider, model_id
    )
    SELECT
      l.provider,
      l.model_id,
      l.id AS latest_run_id,
      l.started_at AS latest_started_at,
      c.total_runs,
      l.total_tokens,
      (l.error IS NOT NULL) AS has_error
    FROM latest l
    JOIN counts c USING (provider, model_id)
    ORDER BY l.provider, l.model_id;
  `);

  return rows.map((r) => ({
    provider: r.provider,
    modelId: r.model_id,
    latestRunId: r.latest_run_id,
    latestRunStartedAt: r.latest_started_at,
    totalRuns: Number(r.total_runs),
    totalTokens: Number(r.total_tokens),
    hasError: r.has_error,
  }));
}

/** Latest successful run id for a given (provider, model_id) — or null. */
export async function getLatestRunIdFor(
  provider: string,
  modelId: string,
): Promise<number | null> {
  const { rows } = await pool.query<{ id: number }>(
    `SELECT id FROM runs
     WHERE provider = $1 AND model_id = $2 AND error IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [provider, modelId],
  );
  return rows[0]?.id ?? null;
}

export async function getRunDetails(runId: number): Promise<RunDetails | null> {
  const { rows: hdr } = await pool.query<{
    id: number;
    provider: Provider;
    model_id: string;
    started_at: Date;
    finished_at: Date;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    finish_reason: string | null;
    error: string | null;
  }>(
    `SELECT id, provider, model_id, started_at, finished_at,
            prompt_tokens, completion_tokens, total_tokens,
            finish_reason, error
     FROM runs WHERE id = $1`,
    [runId],
  );
  const h = hdr[0];
  if (!h) return null;

  const [scoresRes, answersRes] = await Promise.all([
    pool.query<{ axis: string; score: string }>(
      "SELECT axis, score FROM scores WHERE run_id = $1 ORDER BY axis",
      [runId],
    ),
    pool.query<{ question_id: string; response: AnswerLabel }>(
      "SELECT question_id, response FROM answers WHERE run_id = $1 ORDER BY question_id",
      [runId],
    ),
  ]);

  const scores: AxisScore[] = scoresRes.rows.map((r) => ({
    axis: r.axis,
    score: Number(r.score),
  }));
  const answers: AnswerRow[] = answersRes.rows.map((r) => ({
    questionId: r.question_id,
    response: r.response,
  }));

  return {
    id: h.id,
    provider: h.provider,
    modelId: h.model_id,
    startedAt: h.started_at,
    finishedAt: h.finished_at,
    promptTokens: h.prompt_tokens,
    completionTokens: h.completion_tokens,
    totalTokens: h.total_tokens,
    finishReason: h.finish_reason,
    error: h.error,
    scores,
    answers,
  };
}

export async function getRunsForCompare(
  pairs: Array<{ provider: string; modelId: string }>,
): Promise<RunDetails[]> {
  const ids = await Promise.all(
    pairs.map((p) => getLatestRunIdFor(p.provider, p.modelId)),
  );
  const validIds = ids.filter((id): id is number => id !== null);
  const details = await Promise.all(validIds.map((id) => getRunDetails(id)));
  return details.filter((d): d is RunDetails => d !== null);
}

/**
 * The shape every home-page card needs, returned by ONE bulk SQL query
 * (vs. the N+1 storm we had before — `listModelSummaries` + `getRunDetails`
 * per model = ~3×N queries through a 10-connection pool).
 */
export type HomeModelEntry = {
  summary: ModelSummary;
  scores: AxisScore[];
  /** Pre-aggregated answer counts, used by `qualityFromCounts` — saves
   *  shipping all 117 per-question rows. */
  distinctAnswers: number;
  strongCount: number;
  totalAnswered: number;
};

/**
 * Single bulk query that returns everything the home grid needs:
 * latest run per model, total runs, total tokens, scores keyed by axis,
 * and the answer aggregates required by the quality detector.
 */
export async function listHomeModelEntries(): Promise<HomeModelEntry[]> {
  const { rows } = await pool.query<{
    provider: Provider;
    model_id: string;
    latest_run_id: number;
    latest_started_at: Date;
    total_runs: string;
    total_tokens: string;
    scores: Record<string, string> | null;
    distinct_answers: string;
    strong_count: string;
    total_answered: string;
  }>(`
    WITH latest AS (
      SELECT DISTINCT ON (provider, model_id)
        id, provider, model_id, started_at, total_tokens
      FROM runs
      WHERE error IS NULL
      ORDER BY provider, model_id, started_at DESC
    ),
    counts AS (
      SELECT provider, model_id, COUNT(*) AS total_runs
      FROM runs WHERE error IS NULL
      GROUP BY provider, model_id
    ),
    score_agg AS (
      SELECT s.run_id,
             json_object_agg(s.axis, s.score::text) AS scores
      FROM scores s
      JOIN latest l ON l.id = s.run_id
      GROUP BY s.run_id
    ),
    answer_agg AS (
      SELECT a.run_id,
             COUNT(DISTINCT a.response)
               FILTER (WHERE a.response <> 'no_opinion') AS distinct_answers,
             COUNT(*)
               FILTER (WHERE a.response IN ('strongly_agree', 'strongly_disagree')) AS strong_count,
             COUNT(*)
               FILTER (WHERE a.response <> 'no_opinion') AS total_answered
      FROM answers a
      JOIN latest l ON l.id = a.run_id
      GROUP BY a.run_id
    )
    SELECT
      l.provider,
      l.model_id,
      l.id AS latest_run_id,
      l.started_at AS latest_started_at,
      c.total_runs,
      l.total_tokens,
      sa.scores,
      COALESCE(an.distinct_answers, 0) AS distinct_answers,
      COALESCE(an.strong_count, 0) AS strong_count,
      COALESCE(an.total_answered, 0) AS total_answered
    FROM latest l
    JOIN counts c USING (provider, model_id)
    LEFT JOIN score_agg sa ON sa.run_id = l.id
    LEFT JOIN answer_agg an ON an.run_id = l.id
    ORDER BY l.provider, l.model_id;
  `);

  return rows.map((r) => {
    const scores: AxisScore[] = r.scores
      ? Object.entries(r.scores).map(([axis, score]) => ({
          axis,
          score: Number(score),
        }))
      : [];
    return {
      summary: {
        provider: r.provider,
        modelId: r.model_id,
        latestRunId: r.latest_run_id,
        latestRunStartedAt: r.latest_started_at,
        totalRuns: Number(r.total_runs),
        totalTokens: Number(r.total_tokens),
        hasError: false,
      },
      scores,
      distinctAnswers: Number(r.distinct_answers),
      strongCount: Number(r.strong_count),
      totalAnswered: Number(r.total_answered),
    };
  });
}

/** Latest successful run + scores for every tested model. */
export async function listLatestRunsWithScores(): Promise<RunDetails[]> {
  const summaries = await listModelSummaries();
  const details = await Promise.all(
    summaries.map((s) => getRunDetails(s.latestRunId)),
  );
  return details.filter((d): d is RunDetails => d !== null);
}

/**
 * For each Politiscales question, return the distribution of answers across
 * the latest reliable run of every tested model. Used to surface "the most
 * controversial question" and "the most unanimous question" on the home.
 *
 * Result is keyed by question_id; each value lists how many models picked
 * each Likert label (including no_opinion).
 */
export async function getAnswerDistribution(): Promise<
  Map<string, Record<AnswerLabel, number>>
> {
  const { rows } = await pool.query<{
    question_id: string;
    response: AnswerLabel;
    model_count: string;
  }>(`
    WITH latest AS (
      SELECT DISTINCT ON (provider, model_id)
        id
      FROM runs
      WHERE error IS NULL
      ORDER BY provider, model_id, started_at DESC
    )
    SELECT a.question_id, a.response, COUNT(*) AS model_count
    FROM answers a
    JOIN latest l ON l.id = a.run_id
    GROUP BY a.question_id, a.response
  `);

  const map = new Map<string, Record<AnswerLabel, number>>();
  for (const r of rows) {
    let bucket = map.get(r.question_id);
    if (!bucket) {
      bucket = {
        strongly_agree: 0,
        agree: 0,
        neutral: 0,
        disagree: 0,
        strongly_disagree: 0,
        no_opinion: 0,
      };
      map.set(r.question_id, bucket);
    }
    bucket[r.response] = Number(r.model_count);
  }
  return map;
}
