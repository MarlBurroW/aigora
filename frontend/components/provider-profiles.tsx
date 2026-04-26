import { CreatorIcon } from "@/components/creator-icon";
import { Card } from "@/components/ui/card";
import { CREATOR_LABEL, getCreator, type Creator } from "@/lib/creator";
import {
  axisColor,
  axisLabel,
  describeLeftRight,
} from "@/lib/politiscales";
import type {
  AxisScore,
  ModelSummary,
  QualityAssessment,
} from "@/lib/types";

type Item = {
  summary: ModelSummary;
  scores: AxisScore[];
  quality: QualityAssessment;
  lrScore: number;
};

type Props = {
  items: Item[];
  /** How many top creators to show (others fold into "Other"). */
  limit?: number;
};

type CreatorStat = {
  creator: Creator;
  count: number;
  avgLR: number;
  topAxes: { axis: string; mean: number }[];
};

/**
 * Editorial dashboard: the average political shape of each MODEL CREATOR's
 * lineup. Groups by the actual lab/company that built the model (Mistral,
 * Meta, DeepSeek, …) regardless of whether we tested via that creator's
 * SDK or through OpenRouter.
 *
 * Hidden until we have at least 2 creators with ≥ 2 reliable models each.
 */
export function ProviderProfiles({ items, limit = 8 }: Props) {
  const reliable = items.filter((i) => i.quality.flag === "ok");
  const stats = computeCreatorStats(reliable).filter((s) => s.count >= 2);
  if (stats.length < 2) return null;

  const top = stats.slice(0, limit);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Model creator profiles
        </h2>
        <p className="mt-1 text-sm text-foreground/55">
          The average political shape of each creator&apos;s lineup. Computed
          across {reliable.length} reliable models. Showing top {top.length}{" "}
          creators by model count.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {top.map((s) => (
          <CreatorCard key={s.creator} stat={s} />
        ))}
      </div>
    </section>
  );
}

function CreatorCard({ stat }: { stat: CreatorStat }) {
  const desc = describeLeftRight(stat.avgLR);
  const lrSign = stat.avgLR > 0 ? "+" : "";
  const sideColor =
    desc.side === "left"
      ? "#60a5fa"
      : desc.side === "right"
        ? "#fb7185"
        : "#cbd5e1";

  return (
    <Card className="glass p-5">
      <div className="flex items-center gap-3">
        <CreatorIcon
          creator={stat.creator}
          size={28}
          variant="avatar"
          className="rounded-lg"
        />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-foreground/55 truncate">
            {CREATOR_LABEL[stat.creator]}
          </div>
          <div className="text-xs text-foreground/40">
            {stat.count} model{stat.count > 1 ? "s" : ""} averaged
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: sideColor }}
        >
          {desc.label}
        </span>
        <span className="font-mono text-xs tabular-nums text-foreground/45">
          {lrSign}
          {stat.avgLR.toFixed(0)}
        </span>
      </div>
      <div className="relative mt-1 h-1.5 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background:
              "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
          }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-white"
          style={{
            left: `${(stat.avgLR + 100) / 2}%`,
            boxShadow: "0 0 8px rgba(255,255,255,0.6)",
          }}
          aria-hidden
        />
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        {stat.topAxes.slice(0, 3).map((a) => {
          const color = axisColor(a.axis);
          return (
            <div key={a.axis} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="size-1.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="font-mono tabular-nums text-foreground/95 font-semibold w-10">
                {a.mean.toFixed(0)}%
              </span>
              <span className="truncate" style={{ color }}>
                {axisLabel(a.axis)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function computeCreatorStats(items: Item[]): CreatorStat[] {
  const byCreator = new Map<Creator, Item[]>();
  for (const it of items) {
    const c = getCreator(it.summary.provider, it.summary.modelId);
    let bucket = byCreator.get(c);
    if (!bucket) {
      bucket = [];
      byCreator.set(c, bucket);
    }
    bucket.push(it);
  }

  const stats: CreatorStat[] = [];
  for (const [creator, bucket] of byCreator) {
    const count = bucket.length;
    const avgLR = bucket.reduce((sum, it) => sum + it.lrScore, 0) / count;

    const axisSums = new Map<string, number>();
    for (const it of bucket) {
      for (const s of it.scores) {
        axisSums.set(s.axis, (axisSums.get(s.axis) ?? 0) + s.score);
      }
    }
    const topAxes = Array.from(axisSums.entries())
      .map(([axis, total]) => ({ axis, mean: total / count }))
      .sort((a, b) => b.mean - a.mean);

    stats.push({ creator, count, avgLR, topAxes });
  }
  // Sort by model count desc — biggest cohorts first
  return stats.sort((a, b) => b.count - a.count);
}
