import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AnswerList } from "@/components/answer-list";
import { GradientBlob } from "@/components/gradient-blob";
import { CreatorIcon } from "@/components/creator-icon";
import { LeftRightScale } from "@/components/left-right-scale";
import { PoliticalRadar } from "@/components/political-radar";
import { QualityWarning } from "@/components/quality-warning";
import { ScoreBar } from "@/components/score-bar";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import { formatDate, formatTokens } from "@/lib/format";
import { getLatestRunIdFor, getRunDetails } from "@/lib/queries";
import {
  assessAnswerQuality,
  leftRightScore,
  orderAxesCanonical,
} from "@/lib/politiscales";
import type { Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { provider: string; modelId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { provider, modelId } = await params;
  return { title: `${decodeURIComponent(modelId)} — ${provider}` };
}

export default async function ModelPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { provider, modelId } = await params;
  const decodedModelId = decodeURIComponent(modelId);

  const runId = await getLatestRunIdFor(provider, decodedModelId);
  if (runId === null) notFound();
  const run = await getRunDetails(runId);
  if (!run) notFound();

  const sortedScores = [...run.scores].sort((a, b) => b.score - a.score);
  const radarAxes = orderAxesCanonical(run.scores.map((s) => s.axis));
  const lrScore = leftRightScore(run.scores);
  const quality = assessAnswerQuality(run.answers);
  const radarData = run.scores.map((s) => ({
    axis: s.axis,
    model: "score",
    score: s.score,
  }));
  const refusals = run.answers.filter((a) => a.response === "no_opinion");

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 text-sm text-foreground/50">
        <a className="hover:text-foreground/80" href="/">
          Models
        </a>{" "}
        / {CREATOR_LABEL[getCreator(provider as Provider, decodedModelId)]} /{" "}
        {shortModelName(provider as Provider, decodedModelId)}
      </div>

      <section className="relative overflow-hidden rounded-3xl glass p-10">
        <GradientBlob intensity={0.5} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <CreatorIcon
              creator={getCreator(provider as Provider, decodedModelId)}
              size={56}
              variant="avatar"
              className="rounded-xl shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm uppercase tracking-wide text-foreground/50">
                {CREATOR_LABEL[getCreator(provider as Provider, decodedModelId)]}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight truncate">
                {shortModelName(provider as Provider, decodedModelId)}
              </h1>
              <p className="mt-2 text-foreground/60">
                Tested {formatDate(run.startedAt)} ·{" "}
                {formatTokens(run.totalTokens)} tokens · finish_reason ={" "}
                <code className="font-mono text-xs">
                  {run.finishReason ?? "—"}
                </code>
                {provider === "openrouter" && (
                  <>
                    {" "}
                    · <span className="italic">via OpenRouter</span>
                  </>
                )}
              </p>
            </div>
          </div>
          {refusals.length > 0 && (
            <div className="flex flex-col items-end gap-2 text-right">
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-200"
              >
                {refusals.length} refusal{refusals.length > 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </div>
      </section>

      {quality.flag !== "ok" && (
        <section className="mt-6">
          <QualityWarning quality={quality} />
        </section>
      )}

      <section className="mt-6">
        <Card className="glass p-8">
          <LeftRightScale score={lrScore} />
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="glass overflow-hidden p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            Political radar
          </h2>
          <div className="mt-2">
            <PoliticalRadar
              axes={radarAxes}
              data={radarData}
              series={[
                {
                  modelKey: "score",
                  label: decodedModelId,
                  color: "var(--brand-blue)",
                },
              ]}
              height={460}
            />
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
            All scores
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {sortedScores.map((s) => (
              <ScoreBar key={s.axis} axis={s.axis} score={s.score} />
            ))}
          </div>
        </Card>
      </section>

      <Separator className="my-12 bg-white/5" />

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            All 117 questions
          </h2>
          <p className="text-sm text-foreground/50">
            Exact answers as the model returned them.
          </p>
        </div>
        <Card className="glass p-6">
          <AnswerList answers={run.answers} />
        </Card>
      </section>
    </div>
  );
}
