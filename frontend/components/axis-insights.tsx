import { AxisLabel } from "@/components/axis-label";
import { Card } from "@/components/ui/card";
import { axisColor } from "@/lib/politiscales";
import type { AxisScore, ModelSummary, QualityAssessment } from "@/lib/types";

type Item = {
  summary: ModelSummary;
  scores: AxisScore[];
  quality: QualityAssessment;
};

type AxisStat = {
  axis: string;
  mean: number;
  min: number;
  max: number;
  std: number;
  count: number;
};

type Props = {
  items: Item[];
};

export function AxisInsights({ items }: Props) {
  // Drop unreliable models — their scores would skew the aggregates
  const reliable = items.filter((i) => i.quality.flag === "ok");
  if (reliable.length < 3) return null;

  const stats = computeAxisStats(reliable);
  const byAvg = [...stats]
    .sort((a, b) => b.mean - a.mean)
    .slice(0, 5);
  const byStd = [...stats]
    .filter((s) => s.count >= 3) // only meaningful with multiple data points
    .sort((a, b) => b.std - a.std)
    .slice(0, 5);

  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <InsightCard
        title="Where models converge"
        subtitle={`Highest average across ${reliable.length} reliable models — the political shape modern LLMs share.`}
        rows={byAvg}
        markerKind="mean"
        emptyHint="Not enough data yet."
      />
      <InsightCard
        title="Where they split"
        subtitle="Widest spread between models — the open questions in AI training."
        rows={byStd}
        markerKind="range"
        emptyHint="Not enough data to compute spread."
      />
    </section>
  );
}

function InsightCard({
  title,
  subtitle,
  rows,
  markerKind,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  rows: AxisStat[];
  markerKind: "mean" | "range";
  emptyHint: string;
}) {
  return (
    <Card className="glass p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-xs text-foreground/55">{subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-foreground/45 italic">{emptyHint}</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((s) => (
            <li key={s.axis}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <AxisLabel axis={s.axis} className="text-foreground/85" />
                <span className="font-mono text-xs tabular-nums text-foreground/45">
                  {markerKind === "mean" ? (
                    <>
                      avg{" "}
                      <span className="font-semibold text-foreground/95">
                        {s.mean.toFixed(0)}%
                      </span>
                      {" · "}
                      <span className="text-foreground/35">
                        {s.min.toFixed(0)}–{s.max.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <>
                      σ{" "}
                      <span className="font-semibold text-foreground/95">
                        {s.std.toFixed(0)}
                      </span>
                      {" · "}
                      <span className="text-foreground/35">
                        {s.min.toFixed(0)}–{s.max.toFixed(0)}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <RangeBar stat={s} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RangeBar({ stat }: { stat: AxisStat }) {
  const color = axisColor(stat.axis);
  const rangeWidth = Math.max(0.5, stat.max - stat.min);
  return (
    <div className="relative mt-2 h-2 rounded-full bg-white/[0.04] overflow-visible">
      {/* range band — shows the spread */}
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${stat.min}%`,
          width: `${rangeWidth}%`,
          background: `${color}55`,
        }}
        aria-hidden
      />
      {/* mean marker */}
      <div
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-zinc-950"
        style={{
          left: `${stat.mean}%`,
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
        aria-hidden
      />
    </div>
  );
}

/**
 * Six "badge" axes are scored by exactly one question with an empty
 * `valuesNo` weights array — a model only earns a score there if it
 * actively endorses the statement. Models that disagree or stay neutral
 * are simply absent from the bucket.
 *
 * Naively averaging over the bucket therefore reports e.g. "anarchism
 * 100%" even when only 3 models out of 65 endorsed it. To make the
 * aggregate honest, we treat missing values on these axes as 0% — the
 * mean then reflects "average endorsement strength across the entire
 * tested population" instead of "average within self-selected agree-rs".
 *
 * Multi-question paired axes (communism/capitalism, …) and `feminism`
 * (which appears on both yes- and no- sides of many questions) are not
 * padded — every model contributes a score there one way or the other.
 */
const SINGLE_QUESTION_BADGES = new Set([
  "anarchism",
  "complotism",
  "monarchism",
  "pragmatism",
  "religion",
  "veganism",
]);

function computeAxisStats(items: Item[]): AxisStat[] {
  const totalReliable = items.length;
  const buckets = new Map<string, number[]>();
  for (const it of items) {
    for (const s of it.scores) {
      let arr = buckets.get(s.axis);
      if (!arr) {
        arr = [];
        buckets.set(s.axis, arr);
      }
      arr.push(s.score);
    }
  }

  const out: AxisStat[] = [];
  for (const [axis, raw] of buckets) {
    const values = [...raw];
    if (
      SINGLE_QUESTION_BADGES.has(axis) &&
      values.length < totalReliable
    ) {
      // Pad with 0% for every model that didn't endorse the badge.
      values.push(...new Array(totalReliable - values.length).fill(0));
    }
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance =
      values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    out.push({
      axis,
      mean,
      std,
      count: n,
      min: Math.min(...values),
      max: Math.max(...values),
    });
  }
  return out;
}
