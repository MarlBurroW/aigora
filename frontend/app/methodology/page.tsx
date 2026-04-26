import {
  ArrowRight,
  CircleHelp,
  Database,
  GitBranch,
  Layers,
  Network,
  Repeat,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { AnswerPill } from "@/components/answer-pill";
import { AxisLabel } from "@/components/axis-label";
import { GradientBlob } from "@/components/gradient-blob";
import { ProviderIcon } from "@/components/provider-icon";
import { Card } from "@/components/ui/card";
import { dataset, CANONICAL_AXIS_ORDER } from "@/lib/politiscales";
import { listModelSummaries } from "@/lib/queries";
import { SITE } from "@/lib/site";
import type { AnswerLabel, Provider } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Methodology" };

const SAMPLE_QUESTION_IDS = [
  "communism_wealth_ownership",
  "constructivism_becoming_woman",
  "internationalism_border_removal",
  "ecology_climate_change_combat",
  "religion_diffusion",
];

const LIKERT_ORDER: AnswerLabel[] = [
  "strongly_disagree",
  "disagree",
  "neutral",
  "agree",
  "strongly_agree",
  "no_opinion",
];

const LIKERT_VALUES: Record<AnswerLabel, string> = {
  strongly_disagree: "−1",
  disagree: "−⅔",
  neutral: "0",
  agree: "+⅔",
  strongly_agree: "+1",
  no_opinion: "skip",
};

const NATIVE_PROVIDERS: Provider[] = ["openai", "anthropic", "gemini"];

export default async function MethodologyPage() {
  const summaries = await listModelSummaries();

  const stats = [
    { value: dataset.questions.length, label: "Questions" },
    { value: CANONICAL_AXIS_ORDER.length, label: "Political axes" },
    { value: dataset.axes.pairs.length, label: "Paired dimensions" },
    { value: summaries.length, label: "Models tested" },
  ];

  const sampleQuestions = SAMPLE_QUESTION_IDS.map((id) =>
    dataset.questions.find((q) => q.id === id),
  ).filter((q): q is NonNullable<typeof q> => Boolean(q));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Inner wrapper keeps the prose at a comfortable reading width while
          the outer container stays aligned with every other page. */}
      <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl glass p-12">
        <GradientBlob intensity={0.55} />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-foreground/65">
            <Wrench size={12} /> Methodology
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            How {SITE.name} measures the political orientation of an LLM
          </h1>
          <p className="mt-4 max-w-2xl text-foreground/70">
            Every model on this site goes through the exact same protocol —
            same questions, same prompt, same tool schema, same scoring
            algorithm. The numbers you see are reproducible from the open
            data, not editorial.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass p-5">
            <div className="font-mono text-3xl font-semibold tabular-nums text-gradient">
              {s.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-foreground/55">
              {s.label}
            </div>
          </Card>
        ))}
      </section>

      {/* The test */}
      <Section
        icon={<Layers size={16} />}
        title="The test"
        subtitle="Politiscales — 117 statements grouped along 23 political axes."
      >
        <p className="text-foreground/75">
          Politiscales is an{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://politiscales.fr/"
            target="_blank"
            rel="noreferrer"
          >
            open-source political quiz
          </a>{" "}
          built around 8 paired axes (e.g.{" "}
          <em className="not-italic font-medium">communism / capitalism</em>,{" "}
          <em className="not-italic font-medium">
            internationalism / nationalism
          </em>
          ) and 7 unpaired badges (
          <em className="not-italic font-medium">feminism</em>,{" "}
          <em className="not-italic font-medium">veganism</em>,{" "}
          <em className="not-italic font-medium">religion</em>,{" "}
          <em className="not-italic font-medium">complotism</em>,{" "}
          <em className="not-italic font-medium">monarchism</em>,{" "}
          <em className="not-italic font-medium">anarchism</em>,{" "}
          <em className="not-italic font-medium">pragmatism</em>). The scoring
          algorithm is{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://github.com/Conobi/politiscales"
            target="_blank"
            rel="noreferrer"
          >
            ported faithfully from the upstream repo
          </a>
          .
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5 text-xs">
          {CANONICAL_AXIS_ORDER.map((axis) => (
            <span
              key={axis}
              className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-2 py-1 text-foreground/65"
            >
              <AxisLabel axis={axis} size={12} />
            </span>
          ))}
        </div>
      </Section>

      {/* Sample questions */}
      <Section
        icon={<CircleHelp size={16} />}
        title="What the model is asked"
        subtitle="A few representative statements from the questionnaire."
      >
        <ul className="space-y-3">
          {sampleQuestions.map((q, i) => (
            <li
              key={q.id}
              className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm"
            >
              <span className="mt-0.5 font-mono text-xs tabular-nums text-foreground/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground/85">{q.text}</span>
            </li>
          ))}
          <li className="text-xs text-foreground/40 italic">
            … plus {dataset.questions.length - sampleQuestions.length} more.
          </li>
        </ul>
      </Section>

      {/* The answer scale */}
      <Section
        icon={<ArrowRight size={16} />}
        title="The answer scale"
        subtitle="Every model picks one of six positions per statement."
      >
        <div className="flex flex-wrap items-center gap-2">
          {LIKERT_ORDER.map((label) => (
            <div
              key={label}
              className="inline-flex flex-col items-center gap-1.5"
            >
              <AnswerPill answer={label} />
              <span className="font-mono text-[10px] tabular-nums text-foreground/40">
                {LIKERT_VALUES[label]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-foreground/55">
          The numeric values are used to weight each axis when computing
          scores. <code className="rounded bg-white/5 px-1.5 py-0.5">no_opinion</code>{" "}
          is treated as a missing value, not as a zero — it never pulls the
          score in either direction. Models are asked to use it{" "}
          <em>only</em> when a statement is genuinely ambiguous.
        </p>
      </Section>

      {/* How we ask */}
      <Section
        icon={<Network size={16} />}
        title="How we ask"
        subtitle="One forced tool call. All 117 answers in a single API roundtrip."
      >
        <p className="text-foreground/75">
          Every model receives a single message containing{" "}
          <strong className="text-foreground">all 117 statements at once</strong>
          , plus a system prompt that asks it to answer on the 6-position
          scale. The model must reply by calling a single forced{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">
            submit_political_test
          </code>{" "}
          tool — no free-form text — which guarantees a parseable,
          schema-validated payload covering every question.
        </p>

        <pre className="mt-4 overflow-x-auto rounded-lg border border-white/5 bg-zinc-950/60 p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
{`{
  "name": "submit_political_test",
  "parameters": {
    "type": "object",
    "properties": {
      "answers": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question_id": { "type": "string" },
            "response": {
              "type": "string",
              "enum": ["strongly_agree", "agree", "neutral",
                       "disagree", "strongly_disagree", "no_opinion"]
            }
          }
        }
      }
    }
  }
}`}
        </pre>

        <p className="mt-4 text-sm text-foreground/65">
          Asking 117 questions one-by-one would (a) cost ~100× more in input
          tokens, (b) prevent the model from being internally consistent
          across related items, and (c) skew toward models with longer
          multi-turn context handling. A single bundled prompt is cheaper,
          faster, and more comparable across providers.
        </p>
      </Section>

      {/* Providers */}
      <Section
        icon={<GitBranch size={16} />}
        title="Provider integration"
        subtitle="Native SDKs for the Big-3, OpenRouter for everything else."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/55">
              Native (max fidelity)
            </div>
            <div className="flex items-center gap-3">
              {NATIVE_PROVIDERS.map((p) => (
                <ProviderIcon key={p} provider={p} size={28} variant="avatar" />
              ))}
            </div>
            <p className="mt-3 text-sm text-foreground/65">
              OpenAI, Anthropic and Google Gemini are queried through their
              official SDKs — no proxy markup, native tool-use semantics,
              exact inference provenance.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/55">
              OpenRouter (breadth)
            </div>
            <div className="flex items-center gap-3">
              <ProviderIcon provider="openrouter" size={28} variant="avatar" />
            </div>
            <p className="mt-3 text-sm text-foreground/65">
              Open-source and long-tail providers (Mistral, Llama, DeepSeek,
              Qwen, Cohere, Grok…) go through{" "}
              <a
                href="https://openrouter.ai/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                OpenRouter
              </a>
              . Acknowledged trade-off: OpenRouter may route the same model to
              different inference backends (DeepInfra, Together, Fireworks),
              which can introduce micro-variance unrelated to the model
              itself.
            </p>
          </div>
        </div>
      </Section>

      {/* Reproducibility */}
      <Section
        icon={<Repeat size={16} />}
        title="Reproducibility & variance"
        subtitle="Versioned by model_id + timestamp. Multi-run averaging coming."
      >
        <p className="text-foreground/75">
          Every run is versioned by exact{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">
            model_id
          </code>{" "}
          (e.g. <code>gpt-5</code> vs{" "}
          <code>gpt-5-2025-08-07</code>) and timestamp. LLMs are
          non-deterministic — two consecutive runs can drift by a few
          percentage points on borderline questions. A future version of{" "}
          {SITE.name} will surface multi-run averages with confidence
          intervals.
        </p>
        <p className="mt-3 text-sm text-foreground/65">
          Some weaker models don't actually engage with the questionnaire
          (they pattern-match the axis name in the question id rather than
          reading the statement). When detected, those results are flagged
          on the model page with a warning banner so the scores aren't taken
          at face value.
        </p>
      </Section>

      {/* Open data */}
      <Section
        icon={<Database size={16} />}
        title="Open data"
        subtitle="Every answer of every model, exposed as-is."
      >
        <p className="text-foreground/75">
          The site is just a transparent view onto a Postgres table — no
          editorial curation, no interpretation layer. Every per-question
          answer is browsable on each model's page. Disagreements with a
          model's self-reported stance should be addressed to the model, not
          to us.
        </p>
      </Section>

      {/* CTA */}
      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/"
          className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
        >
          <div>
            <div className="text-sm font-medium">See every model tested</div>
            <div className="text-xs text-foreground/55">
              Browse the full grid
            </div>
          </div>
          <ArrowRight
            size={18}
            className="text-foreground/45 transition group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </Link>
        <Link
          href="/ranking"
          className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
        >
          <div>
            <div className="text-sm font-medium">Sort by axis or alignment</div>
            <div className="text-xs text-foreground/55">
              Pick a criterion, get a ranking
            </div>
          </div>
          <ArrowRight
            size={18}
            className="text-foreground/45 transition group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </Link>
      </section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 text-foreground/60">
          <span className="grid size-7 place-items-center rounded-md bg-white/5 text-foreground/80">
            {icon}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-foreground/50">{subtitle}</p>
        )}
      </div>
      <Card className="glass p-7">{children}</Card>
    </section>
  );
}
