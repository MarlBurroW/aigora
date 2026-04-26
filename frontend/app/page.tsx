import { AxisInsights } from "@/components/axis-insights";
import { CreatorOrbit } from "@/components/creator-orbit";
import { GradientBlob } from "@/components/gradient-blob";
import { HeroStats } from "@/components/hero-stats";
import { HomeModelGrid } from "@/components/home-model-grid";
import { ProviderProfiles } from "@/components/provider-profiles";
import { QuestionInsights } from "@/components/question-insights";
import { assessAnswerQuality, leftRightScore } from "@/lib/politiscales";
import {
  getAnswerDistribution,
  getRunDetails,
  listModelSummaries,
} from "@/lib/queries";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const summaries = await listModelSummaries();

  // For each model, fetch its latest run scores + answers so we can both
  // render the card and flag low-engagement responses with a badge.
  const cards = await Promise.all(
    summaries.map(async (s) => {
      const run = await getRunDetails(s.latestRunId);
      const scores = run?.scores ?? [];
      const quality = assessAnswerQuality(run?.answers ?? []);
      const lrScore = leftRightScore(scores);
      return { summary: s, scores, quality, lrScore };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl glass p-12">
        <GradientBlob intensity={0.6} />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70">
              <span
                className="size-1.5 rounded-full bg-emerald-400 animate-pulse"
                aria-hidden
              />
              {summaries.length} model{summaries.length > 1 ? "s" : ""} measured
            </div>
            <h1 className="text-gradient text-6xl font-semibold tracking-tight leading-none sm:text-7xl">
              {SITE.name}
            </h1>
            <p className="mt-3 text-2xl font-medium text-foreground/85 tracking-tight">
              {SITE.tagline}.
            </p>
            <p className="mt-5 max-w-xl text-foreground/65">
              We run the open-source Politiscales test against every major LLM
              and publish the raw answers, the computed scores, and the prompt
              used to ask. Reproducible. Versioned. Transparent.
            </p>
          </div>
          <div className="hidden lg:block">
            <CreatorOrbit />
          </div>
        </div>
      </section>

      {cards.length >= 2 && (
        <section className="mt-8">
          <HeroStats
            items={cards.map((c) => ({
              summary: c.summary,
              lrScore: c.lrScore,
              quality: c.quality,
            }))}
          />
        </section>
      )}

      {cards.length >= 3 && (
        <section className="mt-6">
          <AxisInsights
            items={cards.map((c) => ({
              summary: c.summary,
              scores: c.scores,
              quality: c.quality,
            }))}
          />
        </section>
      )}

      {cards.length >= 4 && (
        <section className="mt-10">
          <ProviderProfiles items={cards} />
        </section>
      )}

      {cards.length >= 5 && (
        <section className="mt-10">
          <QuestionInsights distributions={await getAnswerDistribution()} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Models tested
        </h2>
        {cards.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-foreground/60">
            No runs yet. Run{" "}
            <code className="rounded bg-white/5 px-2 py-1 font-mono text-xs">
              python backend/run_test.py --provider openai
            </code>{" "}
            to populate.
          </div>
        ) : (
          <HomeModelGrid items={cards} />
        )}
      </section>
    </div>
  );
}
