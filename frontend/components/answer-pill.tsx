import type { AnswerLabel } from "@/lib/types";

const STYLES: Record<AnswerLabel, { label: string; classes: string }> = {
  strongly_agree: {
    label: "Strongly agree",
    classes:
      "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
  },
  agree: {
    label: "Agree",
    classes:
      "bg-emerald-500/8 text-emerald-200/85 border-emerald-500/15",
  },
  neutral: {
    label: "Neutral",
    classes: "bg-white/[0.04] text-foreground/55 border-white/10",
  },
  disagree: {
    label: "Disagree",
    classes: "bg-rose-500/8 text-rose-200/85 border-rose-500/15",
  },
  strongly_disagree: {
    label: "Strongly disagree",
    classes: "bg-rose-500/15 text-rose-200 border-rose-500/25",
  },
  no_opinion: {
    label: "No opinion",
    classes: "bg-amber-500/8 text-amber-200/80 italic border-amber-500/15",
  },
};

type Props = {
  answer?: AnswerLabel;
};

export function AnswerPill({ answer }: Props) {
  if (!answer) {
    return <span className="text-foreground/25 italic">—</span>;
  }
  const cfg = STYLES[answer];
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}
