import { describeLeftRight } from "@/lib/politiscales";

type Props = {
  score: number; // -100 (far left) .. +100 (far right)
};

/** Compact L/R indicator for model cards: thin gradient bar + tiny label.
 * Uses the weighted 5-axes formula (more nuanced than the 2-axis compass). */
export function LeftRightMini({ score }: Props) {
  const desc = describeLeftRight(score);
  const pct = (score + 100) / 2;
  const sign = score > 0 ? "+" : "";

  return (
    <div className="w-full">
      <div className="relative h-1.5 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-white/40"
          aria-hidden
        />
        <div
          className="absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-zinc-950 bg-white"
          style={{
            left: `${pct}%`,
            boxShadow: "0 0 8px rgba(255,255,255,0.6)",
          }}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-foreground/35">
        <span>L</span>
        <span className="font-medium text-foreground/60">
          {desc.label}{" "}
          <span className="font-mono text-foreground/35 normal-case tracking-normal">
            ({sign}
            {score.toFixed(0)})
          </span>
        </span>
        <span>R</span>
      </div>
    </div>
  );
}
