import { AxisLabel } from "@/components/axis-label";
import { axisColor } from "@/lib/politiscales";

type Props = {
  axis: string;
  score: number;
  showLabel?: boolean;
};

export function ScoreBar({ axis, score, showLabel = true }: Props) {
  const color = axisColor(axis);
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex flex-col gap-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <AxisLabel axis={axis} className="text-foreground/80" />
          <span className="font-mono tabular-nums text-foreground/60">
            {pct.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}
