import Link from "next/link";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { AxisLabel } from "@/components/axis-label";
import { Card } from "@/components/ui/card";
import { CreatorIcon } from "@/components/creator-icon";
import { GradientBlob } from "@/components/gradient-blob";
import { LeftRightScale } from "@/components/left-right-scale";
import { PoliticalCompassMini } from "@/components/political-compass-mini";
import { PoliticalRadar } from "@/components/political-radar";
import { ScoreBar } from "@/components/score-bar";
import { TrackQuizCompletion } from "@/components/track-quiz-completion";
import {
  CREATOR_LABEL,
  getCreator,
  shortModelName,
} from "@/lib/creator";
import { modelHref } from "@/lib/format";
import {
  describeLeftRight,
  leftRightScore,
  orderAxesCanonical,
  topAxesByScore,
} from "@/lib/politiscales";
import { listLatestRunsWithScores } from "@/lib/queries";
import {
  decodeAnswers,
  computeScoresClient,
  profileDistance,
  profileSimilarity,
} from "@/lib/scoring-client";
import { assessAnswerQuality } from "@/lib/politiscales";
import type { Provider } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your result",
  description:
    "Your political profile from the Aigora self-test, side-by-side with the closest LLM in our database.",
};

type SearchParams = Promise<{ a?: string }>;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const encoded = sp.a ?? "";

  if (!encoded) return <EmptyState />;

  const answers = decodeAnswers(encoded);
  if (Object.keys(answers).length === 0) return <EmptyState />;

  // Score the user's answers exactly the same way we score the LLMs
  const userScoresMap = computeScoresClient(answers);
  const userScores = Object.entries(userScoresMap).map(([axis, score]) => ({
    axis,
    score,
  }));

  if (userScores.length === 0) {
    return (
      <CenteredMessage
        title="No score to compute"
        body="Looks like you skipped or answered no_opinion to every question. Go back and answer at least a few statements."
      />
    );
  }

  const userLR = leftRightScore(userScores);
  const userDesc = describeLeftRight(userLR);
  const userTop = topAxesByScore(userScores, 5);
  const userRadarAxes = orderAxesCanonical(userScores.map((s) => s.axis));

  // Closest match across all reliable LLMs
  const allRuns = await listLatestRunsWithScores();
  type Match = {
    provider: string;
    modelId: string;
    similarity: number;
    distance: number;
    scoresMap: Record<string, number>;
  };
  const matches: Match[] = allRuns
    .filter((r) => assessAnswerQuality(r.answers).flag === "ok")
    .map((r) => {
      const scoresMap: Record<string, number> = {};
      for (const s of r.scores) scoresMap[s.axis] = s.score;
      const distance = profileDistance(userScoresMap, scoresMap);
      return {
        provider: r.provider,
        modelId: r.modelId,
        similarity: profileSimilarity(distance),
        distance,
        scoresMap,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);

  const closest = matches[0];
  const furthest = matches[matches.length - 1];
  const top5 = matches.slice(0, 5);

  // Radar series: user vs closest match
  const series = [
    { modelKey: "you", label: "You", color: "#ffffff" },
    closest && {
      modelKey: "match",
      label: shortModelName(closest.provider as Provider, closest.modelId),
      color: "var(--brand-blue)",
    },
  ].filter(Boolean) as { modelKey: string; label: string; color: string }[];

  const radarData = userRadarAxes.flatMap((axis) => {
    const out = [{ axis, model: "you", score: userScoresMap[axis] ?? 0 }];
    if (closest) {
      out.push({
        axis,
        model: "match",
        score: closest.scoresMap[axis] ?? 0,
      });
    }
    return out;
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {closest && (
        <TrackQuizCompletion
          match={`${closest.provider}/${closest.modelId}`}
          verdict={userDesc.label}
          similarity={closest.similarity}
        />
      )}
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-10">
        <GradientBlob intensity={0.5} />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70">
              <Sparkles size={11} className="text-foreground/55" />
              Your political profile
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              You&apos;re{" "}
              <span className="text-gradient">{userDesc.label}</span>
              <span className="ml-3 text-foreground/45 text-3xl font-mono">
                {userLR > 0 ? "+" : ""}
                {userLR.toFixed(0)}
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-foreground/65">
              Computed from your answers using the same Politiscales weighting
              algorithm we apply to every LLM in the database.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/take-test"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-foreground/70 transition hover:bg-white/5"
              >
                <RefreshCw size={12} />
                Re-take
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-foreground/70 transition hover:bg-white/5"
              >
                <ArrowLeft size={12} />
                Back to models
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <PoliticalCompassMini scores={userScores} size={220} />
          </div>
        </div>
      </section>

      {/* L/R scale */}
      <section className="mt-6">
        <Card className="glass p-8">
          <LeftRightScale score={userLR} />
        </Card>
      </section>

      {/* Closest match — the headline */}
      {closest && (
        <section className="mt-8">
          <Card className="glass p-7">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Closest match
              </h2>
              <span className="text-xs text-foreground/45">
                across {matches.length} reliable LLMs
              </span>
            </div>
            <Link
              href={modelHref(closest.provider, closest.modelId)}
              className="group mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.08]"
              style={{
                boxShadow: "inset 0 0 80px -40px var(--brand-blue)",
              }}
            >
              <div className="flex items-center gap-4">
                <CreatorIcon
                  creator={getCreator(
                    closest.provider as Provider,
                    closest.modelId,
                  )}
                  size={44}
                  variant="avatar"
                  className="rounded-xl"
                />
                <div>
                  <div className="text-xs uppercase tracking-wide text-foreground/55">
                    {CREATOR_LABEL[
                      getCreator(
                        closest.provider as Provider,
                        closest.modelId,
                      )
                    ]}
                  </div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {shortModelName(
                      closest.provider as Provider,
                      closest.modelId,
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gradient tabular-nums">
                  {closest.similarity.toFixed(1)}%
                </div>
                <div className="text-xs uppercase tracking-wider text-foreground/45">
                  similar
                </div>
              </div>
            </Link>
          </Card>
        </section>
      )}

      {/* Side-by-side radar */}
      {closest && userRadarAxes.length >= 3 && (
        <section className="mt-6">
          <Card className="glass p-6">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-foreground/60">
              You vs your closest match
            </h2>
            <PoliticalRadar
              axes={userRadarAxes}
              data={radarData}
              series={series}
              height={460}
            />
          </Card>
        </section>
      )}

      {/* Top-5 most similar */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="glass p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
            Top 5 closest models
          </h2>
          <ol className="divide-y divide-white/5">
            {top5.map((m, i) => (
              <li key={`${m.provider}/${m.modelId}`}>
                <Link
                  href={modelHref(m.provider, m.modelId)}
                  className="grid grid-cols-[2rem_auto_1fr_5rem] items-center gap-3 px-3 py-3 transition hover:bg-white/[0.04]"
                >
                  <span className="font-mono text-base tabular-nums text-foreground/40">
                    #{i + 1}
                  </span>
                  <CreatorIcon
                    creator={getCreator(m.provider as Provider, m.modelId)}
                    size={18}
                  />
                  <div className="min-w-0">
                    <div className="font-medium tracking-tight truncate">
                      {shortModelName(m.provider as Provider, m.modelId)}
                    </div>
                    <div className="text-xs text-foreground/45">
                      {
                        CREATOR_LABEL[
                          getCreator(m.provider as Provider, m.modelId)
                        ]
                      }
                    </div>
                  </div>
                  <div className="text-right font-mono text-base tabular-nums">
                    {m.similarity.toFixed(1)}%
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="glass p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
            Your scores
          </h2>
          <div className="flex flex-col gap-3">
            {userTop.map((s) => (
              <ScoreBar key={s.axis} axis={s.axis} score={s.score} />
            ))}
          </div>
          {furthest && (
            <div className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-foreground/55">
              Furthest from you:{" "}
              <Link
                href={modelHref(furthest.provider, furthest.modelId)}
                className="font-medium text-foreground/85 hover:text-foreground underline underline-offset-2"
              >
                {shortModelName(
                  furthest.provider as Provider,
                  furthest.modelId,
                )}
              </Link>{" "}
              ({furthest.similarity.toFixed(1)}% similar).
            </div>
          )}
        </Card>
      </section>

      {/* Top axes — full breakdown link */}
      {userTop.length > 0 && (
        <section className="mt-6">
          <Card className="glass p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
              Your strongest axes
            </h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {userTop.map((s) => (
                <div key={s.axis} className="inline-flex items-baseline gap-2">
                  <span className="font-mono font-semibold text-foreground/95 tabular-nums">
                    {s.score.toFixed(0)}%
                  </span>
                  <AxisLabel axis={s.axis} className="text-foreground/75" />
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <CenteredMessage
      title="No answers to score"
      body="Looks like you landed here without taking the test."
      cta={{ href: "/take-test", label: "Take the test →" }}
    />
  );
}

function CenteredMessage({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Card className="glass mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-foreground/65">{body}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-5 inline-block rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
          >
            {cta.label}
          </Link>
        )}
      </Card>
    </div>
  );
}
