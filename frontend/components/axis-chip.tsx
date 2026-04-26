import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { iconForAxis } from "@/lib/axis-icons";
import { axisColor, axisLabel } from "@/lib/politiscales";

type Props = {
  axis: string;
  score: number;
  /** When true, renders a larger chip (used on detail pages) */
  large?: boolean;
  /** When false, renders as a span instead of a link — set this when the
   * chip is rendered inside another <a> (e.g. inside a ModelCard) to keep
   * the markup valid. */
  linked?: boolean;
};

export function AxisChip({ axis, score, large = false, linked = true }: Props) {
  const Icon = iconForAxis(axis);
  const color = axisColor(axis);
  const sizes = large
    ? { padX: "px-3", padY: "py-1.5", text: "text-sm", iconSize: 16 }
    : { padX: "px-2.5", padY: "py-1", text: "text-xs", iconSize: 14 };

  const sharedClass = `inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] ${sizes.padX} ${sizes.padY} ${sizes.text} transition hover:bg-white/10`;
  const sharedStyle = {
    // Subtle tint of the axis colour bleeding into the chip
    boxShadow: `inset 0 0 16px -10px ${color}`,
  } as const;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          linked ? (
            <Link
              href={`/axis/${axis}`}
              className={sharedClass}
              style={sharedStyle}
            />
          ) : (
            <span className={sharedClass} style={sharedStyle} />
          )
        }
      >
        <Icon
          size={sizes.iconSize}
          style={{ color }}
          strokeWidth={2.25}
          aria-hidden
        />
        <span className="font-mono font-semibold tabular-nums text-foreground/95">
          {score.toFixed(0)}
          <span className="text-foreground/45">%</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">
          <span className="font-medium">{axisLabel(axis)}</span>{" "}
          <span className="text-foreground/60">— {score.toFixed(1)}%</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
