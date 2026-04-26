import { describeLeftRight } from "@/lib/politiscales";

type Props = {
  /** -100 (far left) .. +100 (far right) */
  score: number;
};

const TICK_LABELS = ["Far Left", "Left", "Center", "Right", "Far Right"];

/**
 * A horizontal red→blue scale with a glowing dot at the model's L/R position.
 * Intentionally reductive — the radar / scores stay the source of truth, this
 * is just the "headline number" view.
 */
export function LeftRightScale({ score }: Props) {
  const desc = describeLeftRight(score);
  // Map score from [-100, +100] to a [0, 100] track position
  const pct = (score + 100) / 2;
  const sign = score > 0 ? "+" : "";

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-foreground/50">
            Political alignment
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {desc.label}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-foreground/50">
            score
          </div>
          <div className="mt-1 font-mono text-3xl tabular-nums">
            {sign}
            {score.toFixed(0)}
          </div>
        </div>
      </div>

      <div className="relative mt-6 h-3 rounded-full overflow-visible">
        {/* gradient track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
          }}
        />
        {/* center tick */}
        <div className="absolute left-1/2 top-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-white/30" />
        {/* moving dot */}
        <div
          className="absolute top-1/2 z-10 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-white"
          style={{
            left: `${pct}%`,
            boxShadow: "0 0 18px rgba(255,255,255,0.6)",
          }}
          aria-hidden
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-foreground/40">
        {TICK_LABELS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      <p className="mt-4 text-xs text-foreground/45">
        Weighted average of 5 paired axes (40% economic, 25% cultural, 20%
        globalism, 10% justice, 5% markets). A reductive summary — the radar
        below is the full picture.
      </p>
    </div>
  );
}
