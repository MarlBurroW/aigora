import { AlertTriangle } from "lucide-react";
import type { QualityAssessment } from "@/lib/politiscales";

type Props = {
  quality: QualityAssessment;
};

const STYLES = {
  very_low: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    iconColor: "text-rose-300",
    title: "Unreliable response — take the scores with a big grain of salt",
  },
  low: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    iconColor: "text-amber-300",
    title: "Limited response quality",
  },
  ok: null,
} as const;

/** Banner displayed on the model detail page when answer quality is poor. */
export function QualityWarning({ quality }: Props) {
  if (quality.flag === "ok") return null;
  const cfg = STYLES[quality.flag];
  if (!cfg) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}
    >
      <AlertTriangle
        size={20}
        className={`${cfg.iconColor} shrink-0 mt-0.5`}
        aria-hidden
      />
      <div className="flex-1">
        <h3 className="text-sm font-semibold tracking-tight">{cfg.title}</h3>
        <p className="mt-1 text-sm text-foreground/70">{quality.reason}</p>
        <p className="mt-2 text-xs font-mono text-foreground/40">
          diagnostic: {quality.distinctAnswers}/6 distinct answer types ·{" "}
          {(quality.strongRatio * 100).toFixed(0)}% extreme (strongly
          agree/disagree)
        </p>
      </div>
    </div>
  );
}

/** Compact pill version, used in dense lists (model cards, ranking rows). */
export function QualityBadge({ quality }: Props) {
  if (quality.flag === "ok") return null;
  const cfg = STYLES[quality.flag];
  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${cfg.border} ${cfg.bg} px-2 py-0.5 text-[10px] uppercase tracking-wider ${cfg.iconColor}`}
      title={quality.reason ?? ""}
    >
      <AlertTriangle size={10} aria-hidden />
      {quality.flag === "very_low" ? "unreliable" : "low quality"}
    </span>
  );
}
