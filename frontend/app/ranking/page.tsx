import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { AxisLabel } from "@/components/axis-label";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { CreatorIcon } from "@/components/creator-icon";
import { iconForAxis } from "@/lib/axis-icons";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import {
  formatDateISO,
  formatDateShort,
  modelHref,
} from "@/lib/format";
import { buildModelColors, colorFor } from "@/lib/model-colors";
import {
  assessAnswerQuality,
  CANONICAL_AXIS_ORDER,
  axisColor,
  axisDescription,
  axisLabel,
  describeLeftRight,
  leftRightScore,
} from "@/lib/politiscales";
import { listLatestRunsWithScores } from "@/lib/queries";
import type { RunDetails } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking" };

const LR_CRITERION = "left_right";

type SearchParams = Promise<{ by?: string }>;

export default async function RankingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const by = sp.by ?? LR_CRITERION;
  const isLR = by === LR_CRITERION;
  const isAxis = (CANONICAL_AXIS_ORDER as readonly string[]).includes(by);
  const validBy = isLR || isAxis ? by : LR_CRITERION;

  const allRuns = await listLatestRunsWithScores();
  // Drop unreliable models (gpt-3.5 pattern-matchers, etc.) — their scores
  // are noise and would skew the ranking. Counted separately so we can
  // surface a footer note explaining the omission.
  const runs = allRuns.filter(
    (r) => assessAnswerQuality(r.answers).flag === "ok",
  );
  const excludedCount = allRuns.length - runs.length;
  const modelColors = buildModelColors(
    runs.map((r) => ({ provider: r.provider, modelId: r.modelId })),
  );

  // Build (run, value) tuples per criterion, then sort.
  type Entry = { run: RunDetails; value: number };
  let entries: Entry[];
  if (validBy === LR_CRITERION) {
    entries = runs.map((r) => ({ run: r, value: leftRightScore(r.scores) }));
    entries.sort((a, b) => a.value - b.value); // most-left first
  } else {
    entries = runs.map((r) => ({
      run: r,
      value: r.scores.find((s) => s.axis === validBy)?.score ?? 0,
    }));
    entries.sort((a, b) => b.value - a.value); // highest first
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl glass p-10">
        <GradientBlob intensity={0.5} />
        <div className="relative">
          <h1 className="text-4xl font-semibold tracking-tight">Ranking</h1>
          <p className="mt-2 max-w-2xl text-foreground/70">
            Sort every tested model by political alignment or any individual
            axis. Click a criterion to re-rank — the URL stays shareable.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <Card className="glass p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/50">
            Sort by
          </h2>
          <div className="flex flex-wrap gap-2">
            <CriterionChip
              href="/ranking"
              active={validBy === LR_CRITERION}
              label="Political alignment"
              color="#ffffff"
              icon={<ArrowLeftRight size={14} />}
            />
            {CANONICAL_AXIS_ORDER.map((axis) => {
              const Icon = iconForAxis(axis);
              const color = axisColor(axis);
              return (
                <CriterionChip
                  key={axis}
                  href={`/ranking?by=${axis}`}
                  active={validBy === axis}
                  label={axisLabel(axis)}
                  color={color}
                  icon={<Icon size={14} strokeWidth={2.25} />}
                />
              );
            })}
          </div>
        </Card>
      </section>

      {validBy !== LR_CRITERION && axisDescription(validBy) && (
        <section className="mt-6">
          <Card
            className="glass p-5"
            style={{
              borderLeft: `3px solid ${axisColor(validBy)}`,
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <AxisLabel
                axis={validBy}
                size={16}
                className="text-base font-semibold"
              />
              <Link
                href={`/axis/${validBy}`}
                className="text-xs text-foreground/45 hover:text-foreground/80 underline underline-offset-2"
              >
                Full axis page →
              </Link>
            </div>
            <p className="mt-2 text-sm text-foreground/75 leading-snug max-w-3xl">
              {axisDescription(validBy)}
            </p>
          </Card>
        </section>
      )}

      <section className="mt-8">
        <Card className="glass overflow-hidden p-2">
          <div className="flex items-baseline justify-between px-3 py-3 text-xs uppercase tracking-wider text-foreground/40">
            <span>
              Ranked by{" "}
              {validBy === LR_CRITERION ? (
                <span className="text-foreground/70">political alignment</span>
              ) : (
                <span className="inline-flex items-baseline gap-1">
                  <AxisLabel axis={validBy} className="text-foreground/70" />
                </span>
              )}
            </span>
            <span>{entries.length} models</span>
          </div>
          <ol className="divide-y divide-white/5">
            {entries.length === 0 && (
              <li className="px-5 py-12 text-center text-foreground/50">
                No models yet.
              </li>
            )}
            {entries.map((e, i) => (
              <li key={`${e.run.provider}/${e.run.modelId}`}>
                <Link
                  href={modelHref(e.run.provider, e.run.modelId)}
                  className="grid grid-cols-[2.5rem_auto_auto_1fr_minmax(180px,40%)_5rem] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.04]"
                >
                  <span className="font-mono text-lg tabular-nums text-foreground/40">
                    #{i + 1}
                  </span>
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{
                      background: colorFor(modelColors, e.run),
                      boxShadow: `0 0 10px ${colorFor(modelColors, e.run)}`,
                    }}
                  />
                  <CreatorIcon
                    creator={getCreator(
                      e.run.provider,
                      e.run.modelId,
                    )}
                    size={22}
                  />
                  <div className="min-w-0">
                    <div className="font-medium tracking-tight truncate">
                      {shortModelName(e.run.provider, e.run.modelId)}
                    </div>
                    <div className="text-xs text-foreground/40">
                      {
                        CREATOR_LABEL[
                          getCreator(e.run.provider, e.run.modelId)
                        ]
                      }{" "}
                      ·{" "}
                      <time
                        dateTime={formatDateISO(e.run.startedAt)}
                        title={formatDateISO(e.run.startedAt)}
                      >
                        {formatDateShort(e.run.startedAt)}
                      </time>
                    </div>
                  </div>
                  {validBy === LR_CRITERION ? (
                    <LRBar score={e.value} />
                  ) : (
                    <AxisProgressBar axis={validBy} score={e.value} />
                  )}
                  <div className="text-right">
                    <div className="font-mono text-xl tabular-nums">
                      {validBy === LR_CRITERION
                        ? `${e.value > 0 ? "+" : ""}${e.value.toFixed(0)}`
                        : `${e.value.toFixed(0)}%`}
                    </div>
                    {validBy === LR_CRITERION && (
                      <div className="text-[10px] uppercase tracking-wider text-foreground/40">
                        {describeLeftRight(e.value).label}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        {excludedCount > 0 && (
          <p className="mt-4 text-center text-xs text-foreground/45">
            {excludedCount} low-quality model
            {excludedCount > 1 ? "s" : ""} excluded from the ranking.{" "}
            <a
              href="/"
              className="underline underline-offset-2 hover:text-foreground/70"
            >
              See them on the home page
            </a>{" "}
            — they're flagged with an "unreliable" badge.
          </p>
        )}
      </section>
    </div>
  );
}

function CriterionChip({
  href,
  active,
  label,
  icon,
  color,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-white/25 bg-white/[0.1] text-foreground"
          : "border-white/5 bg-white/[0.02] text-foreground/65 hover:bg-white/[0.06] hover:text-foreground/90"
      }`}
      style={
        active && color !== "#ffffff"
          ? { boxShadow: `inset 0 0 24px -10px ${color}` }
          : undefined
      }
    >
      <span style={{ color }} className="shrink-0">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function AxisProgressBar({ axis, score }: { axis: string; score: number }) {
  const color = axisColor(axis);
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          boxShadow: `0 0 14px ${color}55`,
        }}
      />
    </div>
  );
}

function LRBar({ score }: { score: number }) {
  const pct = (score + 100) / 2;
  return (
    <div className="relative h-2.5 rounded-full overflow-visible">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/30"
        aria-hidden
      />
      <div
        className="absolute top-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-white"
        style={{
          left: `${pct}%`,
          boxShadow: "0 0 12px rgba(255,255,255,0.7)",
        }}
        aria-hidden
      />
    </div>
  );
}
