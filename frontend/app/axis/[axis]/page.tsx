import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreatorIcon } from "@/components/creator-icon";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { iconForAxis } from "@/lib/axis-icons";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import { modelHref } from "@/lib/format";
import {
  allAxes,
  assessAnswerQuality,
  axisColor,
  axisDescription,
  axisLabel,
  pairOf,
} from "@/lib/politiscales";
import { listLatestRunsWithScores } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = { axis: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { axis } = await params;
  if (!allAxes[axis]) return { title: "Unknown axis" };
  return {
    title: `${axisLabel(axis)} ranking`,
    description: `Every LLM ranked by their ${axisLabel(axis).toLowerCase()} score on the Politiscales test.`,
  };
}

export default async function AxisPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { axis } = await params;
  if (!allAxes[axis]) notFound();

  const Icon = iconForAxis(axis);
  const color = axisColor(axis);
  const label = axisLabel(axis);
  const pair = pairOf(axis);
  const oppositeAxis =
    pair && (pair.left === axis ? pair.right : pair.left);

  // Pull every reliable run, then keep only those that have a score on
  // this axis (some axes are absent for models that didn't engage).
  const allRuns = await listLatestRunsWithScores();
  const ranked = allRuns
    .filter((r) => assessAnswerQuality(r.answers).flag === "ok")
    .map((r) => {
      const score = r.scores.find((s) => s.axis === axis)?.score;
      return score === undefined ? null : { run: r, score };
    })
    .filter((x): x is { run: typeof allRuns[number]; score: number } =>
      x !== null,
    )
    .sort((a, b) => b.score - a.score);

  const totalReliable = allRuns.filter(
    (r) => assessAnswerQuality(r.answers).flag === "ok",
  ).length;

  const meanScore =
    ranked.length > 0
      ? ranked.reduce((sum, r) => sum + r.score, 0) / ranked.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 text-sm text-foreground/50">
        <Link href="/" className="hover:text-foreground/80">
          Models
        </Link>{" "}
        / <span>Axis</span> /{" "}
        <span className="text-foreground/80">{label}</span>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl glass p-10"
        style={{
          boxShadow: `inset 0 0 120px -40px ${color}55`,
        }}
      >
        <GradientBlob intensity={0.4} />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70">
              <Icon size={12} style={{ color }} />
              Politiscales axis
            </div>
            <h1
              className="text-5xl font-semibold tracking-tight"
              style={{ color }}
            >
              {label}
            </h1>
            {axisDescription(axis) && (
              <p className="mt-3 max-w-xl text-foreground/85 text-lg leading-snug">
                {axisDescription(axis)}
              </p>
            )}
            <p className="mt-3 max-w-xl text-sm text-foreground/55">
              Higher percentage = stronger alignment with this side of the
              spectrum.
              {oppositeAxis && (
                <>
                  {" "}
                  The opposite axis is{" "}
                  <Link
                    href={`/axis/${oppositeAxis}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {axisLabel(oppositeAxis)}
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <div className="text-xs uppercase tracking-wider text-foreground/45">
              {ranked.length} of {totalReliable} reliable models scored
            </div>
            <div className="font-mono text-3xl font-semibold tabular-nums">
              {meanScore.toFixed(0)}%
            </div>
            <div className="text-xs uppercase tracking-wider text-foreground/45">
              average
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mt-8">
        <Card className="glass overflow-hidden p-2">
          {ranked.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-foreground/45">
              No model scored on this axis yet.
            </p>
          ) : (
            <ol className="divide-y divide-white/5">
              {ranked.map((entry, i) => (
                <li key={`${entry.run.provider}/${entry.run.modelId}`}>
                  <Link
                    href={modelHref(entry.run.provider, entry.run.modelId)}
                    className="grid grid-cols-[2.5rem_auto_1fr_minmax(180px,40%)_5rem] items-center gap-4 px-5 py-3 transition hover:bg-white/[0.04]"
                  >
                    <span className="font-mono text-base tabular-nums text-foreground/40">
                      #{i + 1}
                    </span>
                    <CreatorIcon
                      creator={getCreator(
                        entry.run.provider,
                        entry.run.modelId,
                      )}
                      size={18}
                    />
                    <div className="min-w-0">
                      <div className="font-medium tracking-tight truncate">
                        {shortModelName(
                          entry.run.provider,
                          entry.run.modelId,
                        )}
                      </div>
                      <div className="text-xs text-foreground/40">
                        {
                          CREATOR_LABEL[
                            getCreator(
                              entry.run.provider,
                              entry.run.modelId,
                            )
                          ]
                        }
                      </div>
                    </div>
                    <ScoreBar score={entry.score} color={color} />
                    <div className="text-right font-mono text-lg font-semibold tabular-nums">
                      {entry.score.toFixed(0)}%
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/ranking"
          className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
        >
          <div>
            <div className="text-sm font-medium">Sort by another axis</div>
            <div className="text-xs text-foreground/55">
              Pick from all 23 Politiscales axes
            </div>
          </div>
          <ArrowLeft
            size={18}
            className="rotate-180 text-foreground/45 transition group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </Link>
        <Link
          href="/methodology"
          className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
        >
          <div>
            <div className="text-sm font-medium">How is this computed?</div>
            <div className="text-xs text-foreground/55">
              See the methodology
            </div>
          </div>
          <ArrowLeft
            size={18}
            className="rotate-180 text-foreground/45 transition group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </Link>
      </section>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          boxShadow: `0 0 14px ${color}55`,
        }}
      />
    </div>
  );
}
