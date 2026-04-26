import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Database,
  HelpCircle,
  MessageSquare,
  Server,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { ProviderIcon } from "@/components/provider-icon";
import { listModelSummaries } from "@/lib/queries";
import { dataset } from "@/lib/politiscales";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "About" };

export default async function AboutPage() {
  let modelCount = 0;
  try {
    modelCount = (await listModelSummaries()).length;
  } catch {
    /* ignore */
  }
  const questionCount = dataset.questions.length;
  const axisCount =
    Object.keys(dataset.axes.paired).length +
    Object.keys(dataset.axes.unpaired).length;
  const pairCount = dataset.axes.pairs.length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl glass p-10">
          <GradientBlob intensity={0.5} />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70">
              About {SITE.name}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Where does your AI{" "}
              <span className="text-gradient">stand</span>, really?
            </h1>
            <p className="mt-3 max-w-2xl text-foreground/70 text-lg">
              Every large language model carries the political fingerprints
              of its training data and post-training alignment. {SITE.name}{" "}
              is a transparent, reproducible way to surface those
              fingerprints — by running the same political quiz against
              every model and publishing every answer.
            </p>
          </div>
        </section>

        {/* Stats strip */}
        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Models tested" value={`${modelCount}+`} />
          <Stat label="Questions per run" value={questionCount} />
          <Stat label="Political axes" value={axisCount} />
          <Stat label="Paired dimensions" value={pairCount} />
        </section>

        {/* The premise */}
        <Section
          icon={<Target size={16} />}
          title="The premise"
          subtitle="Not all training is created equal — and it shows."
        >
          <p className="text-foreground/80">
            Modern LLMs are trained on a slice of the internet, then tuned
            with human feedback to be "helpful, harmless, honest". Both
            steps embed political assumptions: which sources count as
            authoritative, which positions count as harmful, which framings
            count as honest.{" "}
          </p>
          <p className="mt-3 text-foreground/80">
            Most providers won&apos;t volunteer that information.{" "}
            <strong>{SITE.name}</strong> infers it the only way you can
            from the outside: by asking models direct questions and reading
            their answers — at scale, in public, with a methodology anyone
            can audit, fork, or contradict.
          </p>
        </Section>

        {/* The method */}
        <Section
          icon={<BookOpen size={16} />}
          title="The method, in one paragraph"
          subtitle={
            <>
              Want the long version?{" "}
              <Link
                href="/methodology"
                className="underline underline-offset-2 hover:text-foreground"
              >
                See the methodology page
              </Link>
              .
            </>
          }
        >
          <p className="text-foreground/80">
            We use{" "}
            <a
              href="https://politiscales.fr/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Politiscales
            </a>
            , an open-source 117-question political quiz scored along 23
            axes. We send all 117 statements to each model in a single
            prompt and force a structured tool call — the model has to
            answer every question on the standard 5-point Likert scale (or
            opt out via <code className="text-foreground">no_opinion</code>
            ). The same scoring algorithm that powers the original site
            computes the per-axis scores. No system prompt that "frees" or
            "primes" the model; it answers the way it would if a user
            pasted the quiz into a chat.
          </p>
        </Section>

        {/* What we don't do */}
        <Section
          icon={<ShieldAlert size={16} />}
          title="What we deliberately don't do"
          subtitle="Things that would invalidate the result."
        >
          <ul className="space-y-2 text-foreground/80">
            <li className="flex gap-3">
              <span className="text-foreground/35 shrink-0">—</span>
              <span>
                <strong>No "jailbreak" prompts.</strong> No system message
                that tries to bypass safety, unlock "true opinions", or roleplay
                a persona. The model responds as it would in production.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground/35 shrink-0">—</span>
              <span>
                <strong>No question cherry-picking.</strong> Every model
                gets the same 117 questions. We don't drop the boring ones.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground/35 shrink-0">—</span>
              <span>
                <strong>No editorial reweighting of scores.</strong> The
                Politiscales scoring algorithm is ported byte-for-byte from
                the upstream JS — we don&apos;t change the math because we
                don&apos;t like a result.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground/35 shrink-0">—</span>
              <span>
                <strong>No silent retries.</strong> Every model answers
                exactly once per nightly run. Failures (refusals, malformed
                responses) are logged with their error and visible.
              </span>
            </li>
          </ul>
        </Section>

        {/* The stack */}
        <Section
          icon={<Server size={16} />}
          title="Built with"
          subtitle="100% open source, self-hosted on a homelab Kubernetes cluster."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/55">
                Backend
              </div>
              <ul className="space-y-1.5 text-sm text-foreground/75">
                <li>Python orchestrator + scoring port</li>
                <li>Native SDKs for OpenAI / Anthropic / Google</li>
                <li>OpenRouter for the long tail (~200 more models)</li>
                <li>Postgres 17 for storage</li>
                <li>Kubernetes CronJob, nightly</li>
              </ul>
              <div className="mt-4 flex items-center gap-2.5">
                <ProviderIcon provider="openai" size={20} variant="avatar" />
                <ProviderIcon provider="anthropic" size={20} variant="avatar" />
                <ProviderIcon provider="gemini" size={20} variant="avatar" />
                <ProviderIcon provider="openrouter" size={20} variant="avatar" />
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/55">
                Frontend
              </div>
              <ul className="space-y-1.5 text-sm text-foreground/75">
                <li>Next.js 16 (App Router, Server Components)</li>
                <li>Tailwind v4 + shadcn/ui</li>
                <li>Recharts for the radar charts</li>
                <li>@lobehub/icons for provider logos</li>
                <li>next/og for dynamic OG cards</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-foreground/65">
            <Sparkles size={14} className="text-foreground/55" />
            Built in a weekend with{" "}
            <a
              href="https://www.anthropic.com/claude-code"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Claude Code
            </a>{" "}
            — every commit is in the repo.
          </div>
        </Section>

        {/* Caveats */}
        <Section
          icon={<HelpCircle size={16} />}
          title="Caveats &amp; limits"
          subtitle="Things worth knowing before you draw conclusions."
        >
          <ul className="space-y-3 text-foreground/80">
            <li>
              <strong className="text-foreground">Non-determinism.</strong>{" "}
              LLMs sample stochastically — two consecutive runs on the same
              model can drift a few percentage points on borderline
              questions. We currently surface the latest run; future
              versions will average over multiple runs with confidence
              intervals.
            </li>
            <li>
              <strong className="text-foreground">
                Pattern-matching models.
              </strong>{" "}
              A handful of weaker models (e.g.{" "}
              <code className="text-foreground">gpt-3.5-turbo</code>)
              don&apos;t actually engage with the statement — they
              pattern-match the axis prefix in the question id and emit
              binary strongly-agree/disagree. We flag these with an
              "unreliable" badge and exclude them from rankings and
              aggregates.
            </li>
            <li>
              <strong className="text-foreground">
                OpenRouter routing variance.
              </strong>{" "}
              Models behind OpenRouter can be served by different inference
              providers (DeepInfra, Together, Fireworks…). Same model,
              different infra, micro-differences in output. The Big-3 are
              queried natively to avoid this.
            </li>
            <li>
              <strong className="text-foreground">Reductive metrics.</strong>{" "}
              Single-number summaries like the L/R score lose information.
              They&apos;re useful headlines, but the radar and per-question
              data are the real ground truth.
            </li>
          </ul>
        </Section>

        {/* Open data */}
        <Section
          icon={<Database size={16} />}
          title="Open data"
          subtitle="Every answer of every model — browsable, downloadable."
        >
          <p className="text-foreground/80">
            The Postgres schema, the scoring algorithm and the full runner
            code are open source on GitHub. Nothing is curated, nothing is
            cherry-picked. Per-question answers for every tested model are
            visible on each model&apos;s page. A public read-only API is
            on the roadmap.
          </p>
        </Section>

        {/* FAQ */}
        <Section
          icon={<HelpCircle size={16} />}
          title="Frequently asked"
          subtitle="Things people DM us about."
        >
          <div className="space-y-5">
            <Faq q="Why Politiscales and not the political compass / 8values / OECD survey?">
              Politiscales is open source, multi-axis (23 dimensions vs 2
              for the political compass), and its 117 questions are concise
              enough to fit comfortably in one prompt. The scoring algorithm
              is also reasonably documented — important for reproducibility.
              We may add other tests later as comparison points.
            </Faq>
            <Faq q="Why does the average AI lean progressive / pro-regulation / internationalist?">
              That&apos;s an empirical observation, not a design choice.
              Possible explanations include over-representation of
              progressive viewpoints in the training corpora, RLHF
              annotators leaning that way, providers proactively avoiding
              culturally conservative answers as a liability, or all of the
              above. We measure; we don&apos;t explain. The data is there
              for you to make your own case.
            </Faq>
            <Faq q="Can a model rig its own score?">
              In principle yes — a model that recognizes the Politiscales
              quiz could refuse, or answer strategically to land on a
              specific position. We don&apos;t see this in practice yet, but
              we should expect it as awareness of these tests grows.
              Opacity of training is the only real defense for the model;
              transparency of testing is the only real defense for the
              user.
            </Faq>
            <Faq q="Is this safe to share / cite?">
              The methodology is reproducible and the data is open, so yes
              — but please link the model&apos;s page rather than
              screenshot, so the reader can see the actual answers and the
              date the test was run. Models drift over time.
            </Faq>
          </div>
        </Section>

        {/* CTA links */}
        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <a
            href="https://github.com/MarlBurroW/aigora"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <Code2 size={20} className="text-foreground/55" />
              <div>
                <div className="text-sm font-medium">Source code</div>
                <div className="text-xs text-foreground/55">
                  github.com/MarlBurroW/aigora
                </div>
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="text-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            />
          </a>
          <a
            href="https://github.com/Conobi/politiscales"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <Database size={20} className="text-foreground/55" />
              <div>
                <div className="text-sm font-medium">
                  Politiscales upstream
                </div>
                <div className="text-xs text-foreground/55">
                  Open-source quiz this site uses
                </div>
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="text-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            />
          </a>
          <a
            href={`https://x.com/${SITE.twitterHandle.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-foreground/55" />
              <div>
                <div className="text-sm font-medium">Suggest a model</div>
                <div className="text-xs text-foreground/55">
                  DM {SITE.twitterHandle} on X
                </div>
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="text-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            />
          </a>
          <Link
            href="/methodology"
            className="group flex items-center justify-between rounded-xl glass p-5 transition hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-foreground/55" />
              <div>
                <div className="text-sm font-medium">Full methodology</div>
                <div className="text-xs text-foreground/55">
                  How the test is administered &amp; scored
                </div>
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="text-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            />
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="glass p-4">
      <div className="text-xs uppercase tracking-wider text-foreground/45">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gradient">{value}</div>
    </Card>
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
  subtitle?: React.ReactNode;
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

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-foreground/95">{q}</div>
      <div className="mt-1.5 text-sm text-foreground/70">{children}</div>
    </div>
  );
}
