import Link from "next/link";
import { AxisChip } from "@/components/axis-chip";
import { CreatorIcon } from "@/components/creator-icon";
import { Card } from "@/components/ui/card";
import { GradientBlob } from "@/components/gradient-blob";
import { LeftRightMini } from "@/components/left-right-mini";
import { PoliticalCompassMini } from "@/components/political-compass-mini";
import { QualityBadge } from "@/components/quality-warning";
import { CREATOR_LABEL, getCreator, shortModelName } from "@/lib/creator";
import {
  formatDateISO,
  formatDateShort,
  formatTokens,
  modelHref,
} from "@/lib/format";
import { leftRightScore, topAxesByScore } from "@/lib/politiscales";
import type { AxisScore, ModelSummary, QualityAssessment } from "@/lib/types";

type Props = {
  summary: ModelSummary;
  scores: AxisScore[];
  quality: QualityAssessment;
};

export function ModelCard({ summary, scores, quality }: Props) {
  const top = topAxesByScore(scores, 3);
  const lr = leftRightScore(scores);
  const creator = getCreator(summary.provider, summary.modelId);
  const displayName = shortModelName(summary.provider, summary.modelId);

  return (
    <Link
      href={modelHref(summary.provider, summary.modelId)}
      className="group block"
    >
      <Card className="glass relative overflow-hidden p-6 transition hover:bg-white/[0.06]">
        <GradientBlob intensity={0.35} />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CreatorIcon
              creator={creator}
              size={32}
              variant="avatar"
              className="rounded-lg shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-foreground/50">
                {CREATOR_LABEL[creator]}
              </div>
              <div className="font-medium tracking-tight truncate">
                {displayName}
              </div>
              {summary.provider === "openrouter" && (
                <div className="text-[10px] italic text-foreground/35">
                  via OpenRouter
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-xs text-foreground/50">
            {quality.flag !== "ok" && <QualityBadge quality={quality} />}
            <time
              dateTime={formatDateISO(summary.latestRunStartedAt)}
              title={formatDateISO(summary.latestRunStartedAt)}
              className="block text-foreground/70"
            >
              {formatDateShort(summary.latestRunStartedAt)}
            </time>
            <div>
              {summary.totalRuns} run{summary.totalRuns > 1 ? "s" : ""}
            </div>
            <div className="font-mono">
              {formatTokens(summary.totalTokens)} tok
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <PoliticalCompassMini scores={scores} size={200} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {top.length === 0 ? (
            <span className="text-sm text-foreground/40 italic">
              no signature axis
            </span>
          ) : (
            top.map((s) => (
              <AxisChip
                key={s.axis}
                axis={s.axis}
                score={s.score}
                linked={false}
              />
            ))
          )}
        </div>

        <div className="mt-5">
          <LeftRightMini score={lr} />
        </div>
      </Card>
    </Link>
  );
}
