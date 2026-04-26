import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleDot } from "lucide-react";
import { CreatorIcon } from "@/components/creator-icon";
import { Card } from "@/components/ui/card";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import { modelHref } from "@/lib/format";
import { describeLeftRight } from "@/lib/politiscales";
import type { ModelSummary, QualityAssessment } from "@/lib/types";

type Pick = {
  summary: ModelSummary;
  lrScore: number;
};

type Props = {
  items: Array<{
    summary: ModelSummary;
    lrScore: number;
    quality: QualityAssessment;
  }>;
};

/**
 * Editorial dashboard above the model grid: spotlights the three most
 * extreme models on the left/right axis. Low-quality models (pattern-
 * matchers like gpt-3.5) are excluded from the picks since their scores
 * aren't reliable.
 */
export function HeroStats({ items }: Props) {
  const reliable = items.filter((i) => i.quality.flag === "ok");
  if (reliable.length < 2) return null;

  const sortedByLR = [...reliable].sort((a, b) => a.lrScore - b.lrScore);
  const left = sortedByLR[0];
  const right = sortedByLR[sortedByLR.length - 1];
  const centrist = [...reliable].sort(
    (a, b) => Math.abs(a.lrScore) - Math.abs(b.lrScore),
  )[0];

  // If left and right are the same model (i.e. only 1 reliable model),
  // hide the strip — no story to tell.
  if (left === right) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="Most left-leaning"
        icon={<ArrowLeft size={12} />}
        accent="#1e40af"
        pick={left}
      />
      <StatCard
        label="Most centrist"
        icon={<CircleDot size={12} />}
        accent="#94a3b8"
        pick={centrist}
      />
      <StatCard
        label="Most right-leaning"
        icon={<ArrowRight size={12} />}
        accent="#dc2626"
        pick={right}
      />
    </section>
  );
}

function StatCard({
  label,
  icon,
  accent,
  pick,
}: {
  label: string;
  icon: React.ReactNode;
  accent: string;
  pick: Pick;
}) {
  const desc = describeLeftRight(pick.lrScore);
  const sign = pick.lrScore > 0 ? "+" : "";
  const pct = (pick.lrScore + 100) / 2;
  const creator = getCreator(pick.summary.provider, pick.summary.modelId);
  const displayName = shortModelName(
    pick.summary.provider,
    pick.summary.modelId,
  );
  return (
    <Link
      href={modelHref(pick.summary.provider, pick.summary.modelId)}
      className="group block"
    >
      <Card className="glass p-5 transition hover:bg-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/55">
          <span style={{ color: accent }}>{icon}</span>
          {label}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <CreatorIcon
            creator={creator}
            size={32}
            variant="avatar"
            className="rounded-lg shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium tracking-tight truncate">
              {displayName}
            </div>
            <div className="text-xs text-foreground/50">
              {CREATOR_LABEL[creator]}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-lg font-semibold tabular-nums">
              {sign}
              {pick.lrScore.toFixed(0)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-foreground/45">
              {desc.label}
            </div>
          </div>
        </div>

        {/* Mini L/R indicator showing where this pick sits */}
        <div className="relative mt-4 h-1 rounded-full overflow-visible">
          <div
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background:
                "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
            }}
          />
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950"
            style={{
              left: `${pct}%`,
              backgroundColor: accent,
              boxShadow: `0 0 10px ${accent}`,
            }}
            aria-hidden
          />
        </div>
      </Card>
    </Link>
  );
}
