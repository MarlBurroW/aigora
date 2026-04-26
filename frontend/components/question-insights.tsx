import { Card } from "@/components/ui/card";
import { ANSWER_LABEL } from "@/lib/format";
import { questionById } from "@/lib/politiscales";
import type { AnswerLabel } from "@/lib/types";

type Distribution = Record<AnswerLabel, number>;

type Props = {
  distributions: Map<string, Distribution>;
};

const ANSWER_COLORS: Record<AnswerLabel, string> = {
  strongly_agree: "#34d399",
  agree: "#a7f3d0",
  neutral: "#94a3b8",
  disagree: "#fda4af",
  strongly_disagree: "#fb7185",
  no_opinion: "#fbbf24",
};

const ORDER: AnswerLabel[] = [
  "strongly_agree",
  "agree",
  "neutral",
  "disagree",
  "strongly_disagree",
  "no_opinion",
];

type Scored = {
  questionId: string;
  text: string;
  total: number;
  noOpinion: number;
  /** Variance of "agreement value" across responding models. */
  variance: number;
  dist: Distribution;
};

const ANSWER_VALUE: Record<AnswerLabel, number | null> = {
  strongly_agree: 2,
  agree: 1,
  neutral: 0,
  disagree: -1,
  strongly_disagree: -2,
  no_opinion: null,
};

/**
 * Two side-by-side cards: the question with the WIDEST disagreement, and
 * the one with the TIGHTEST consensus. Each card shows the question, a
 * stacked distribution bar, and the per-label model counts.
 */
export function QuestionInsights({ distributions }: Props) {
  if (distributions.size < 2) return null;

  const scored = scoreQuestions(distributions);
  if (scored.length === 0) return null;

  const split = [...scored].sort((a, b) => b.variance - a.variance)[0];
  const consensual = [...scored]
    .filter((s) => s.total - s.noOpinion >= 3) // need real votes
    .sort((a, b) => a.variance - b.variance)[0];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Question-level insights
        </h2>
        <p className="mt-1 text-sm text-foreground/55">
          Of the 117 statements, the ones where LLMs disagree the most — and
          where they agree the most.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <QuestionCard
          label="Most polarizing question"
          subtitle="Where models split hardest. Answer values vary most across the lineup."
          q={split}
        />
        {consensual && (
          <QuestionCard
            label="Most unanimous question"
            subtitle="Where every reliable model lands in nearly the same spot."
            q={consensual}
          />
        )}
      </div>
    </section>
  );
}

function QuestionCard({
  label,
  subtitle,
  q,
}: {
  label: string;
  subtitle: string;
  q: Scored;
}) {
  return (
    <Card className="glass p-6">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/55">
        {label}
      </div>
      <p className="mt-1 text-xs text-foreground/45">{subtitle}</p>

      <blockquote className="mt-5 border-l-2 border-white/15 pl-4 text-base text-foreground/95 italic">
        “{q.text}”
      </blockquote>

      {/* Stacked distribution bar */}
      <div
        className="mt-5 flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`Distribution of ${q.total} model answers`}
      >
        {ORDER.map((lbl) => {
          const v = q.dist[lbl];
          if (!v) return null;
          const pct = (v / q.total) * 100;
          return (
            <div
              key={lbl}
              style={{
                width: `${pct}%`,
                background: ANSWER_COLORS[lbl],
              }}
              title={`${ANSWER_LABEL[lbl]}: ${v} model${v > 1 ? "s" : ""}`}
            />
          );
        })}
      </div>

      {/* Legend / counts */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {ORDER.map((lbl) => {
          const v = q.dist[lbl];
          if (!v) return null;
          return (
            <span
              key={lbl}
              className="inline-flex items-center gap-1.5 text-foreground/60"
            >
              <span
                aria-hidden
                className="size-2 rounded-full shrink-0"
                style={{ background: ANSWER_COLORS[lbl] }}
              />
              <span className="font-mono tabular-nums text-foreground/85">
                {v}
              </span>
              <span>{ANSWER_LABEL[lbl]}</span>
            </span>
          );
        })}
      </div>
    </Card>
  );
}

function scoreQuestions(
  distributions: Map<string, Distribution>,
): Scored[] {
  const out: Scored[] = [];
  for (const [questionId, dist] of distributions) {
    const q = questionById[questionId];
    if (!q) continue;

    const total = ORDER.reduce((s, l) => s + (dist[l] ?? 0), 0);
    if (total === 0) continue;

    const noOpinion = dist.no_opinion ?? 0;
    const responding = total - noOpinion;
    if (responding === 0) {
      out.push({ questionId, text: q.text, total, noOpinion, variance: 0, dist });
      continue;
    }

    // Mean answer value
    let sum = 0;
    for (const lbl of ORDER) {
      const v = ANSWER_VALUE[lbl];
      if (v === null) continue;
      sum += v * (dist[lbl] ?? 0);
    }
    const mean = sum / responding;

    // Variance
    let varSum = 0;
    for (const lbl of ORDER) {
      const v = ANSWER_VALUE[lbl];
      if (v === null) continue;
      varSum += (dist[lbl] ?? 0) * (v - mean) ** 2;
    }
    const variance = varSum / responding;

    out.push({ questionId, text: q.text, total, noOpinion, variance, dist });
  }
  return out;
}
