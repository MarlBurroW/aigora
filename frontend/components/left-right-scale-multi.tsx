import { describeLeftRight } from "@/lib/politiscales";

type Entry = {
  provider: string;
  modelId: string;
  score: number;
  color: string;
};

type Props = {
  entries: Entry[];
};

const TICK_LABELS = ["Far Left", "Left", "Center", "Right", "Far Right"];

/**
 * Multi-model variant of the L/R scale: one row per model, each with its
 * own colored dot on a shared gradient track. Quick visual ranking +
 * absolute positioning.
 */
export function LeftRightScaleMulti({ entries }: Props) {
  // Sort by score so the rendering reads left-to-right from "most left" to
  // "most right" model, helping the eye scan the ranking instantly.
  const sorted = [...entries].sort((a, b) => a.score - b.score);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-foreground/50">
            Political alignment ranking
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">
            {sorted.length} model{sorted.length > 1 ? "s" : ""} on a single
            axis
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sorted.map((e) => {
          const desc = describeLeftRight(e.score);
          const pct = (e.score + 100) / 2;
          const sign = e.score > 0 ? "+" : "";
          return (
            <div key={`${e.provider}/${e.modelId}`}>
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span
                  className="font-medium"
                  style={{ color: e.color }}
                >
                  {e.modelId}
                </span>
                <span className="text-foreground/60">
                  {desc.label}{" "}
                  <span className="font-mono tabular-nums text-foreground/40">
                    ({sign}
                    {e.score.toFixed(0)})
                  </span>
                </span>
              </div>
              <div className="relative h-2.5 rounded-full overflow-visible">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #1e40af 0%, #60a5fa 25%, #64748b 50%, #fb7185 75%, #dc2626 100%)",
                  }}
                />
                <div
                  className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/30"
                  aria-hidden
                />
                <div
                  className="absolute top-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950"
                  style={{
                    left: `${pct}%`,
                    backgroundColor: e.color,
                    boxShadow: `0 0 14px ${e.color}`,
                  }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-wider text-foreground/40">
        {TICK_LABELS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
