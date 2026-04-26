import { compassPosition, describePosition } from "@/lib/politiscales";
import type { AxisScore } from "@/lib/types";

type Props = {
  scores: AxisScore[];
  size?: number;
};

const LABEL_COLOR = "rgba(255,255,255,0.55)";
const GRID_COLOR = "rgba(255,255,255,0.18)";
const QUADRANT_STROKE = "rgba(255,255,255,0.08)";

/**
 * Compact political-compass thumbnail, fully SVG (no rotated HTML elements).
 * Displays a derived plain-language position descriptor above the plot so
 * the card communicates a verdict, not just coordinates.
 */
export function PoliticalCompassMini({ scores, size = 220 }: Props) {
  const { x, y } = compassPosition(scores);
  const desc = describePosition(x, y);

  // 22px margin reserved on each side for axis labels.
  const margin = 22;
  const plot = size - 2 * margin;
  const cx = size / 2;
  const cy = size / 2;
  const dotX = cx + x * (plot / 2 - 6);
  const dotY = cy - y * (plot / 2 - 6); // SVG y inverted

  // Glow intensity scales with how far from center the model sits.
  const magnitude = Math.min(1, Math.hypot(x, y));
  const glowOpacity = 0.4 + 0.5 * magnitude;
  const glowRadius = 14 + 6 * magnitude;

  const intensityClass = {
    centrist: "text-foreground/55",
    mild: "text-foreground/75",
    moderate: "text-foreground/95",
    strong: "text-gradient",
  }[desc.intensity];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${intensityClass}`}
      >
        {desc.intensity === "centrist"
          ? "Centrist"
          : `${capitalize(desc.intensity)} · ${desc.label}`}
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="block"
        aria-label="Political compass position"
      >
        <defs>
          <radialGradient id="cm-bg" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="color-mix(in srgb, var(--brand-blue) 10%, transparent)"
            />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="cm-dot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-blue)" />
            <stop offset="100%" stopColor="var(--brand-green)" />
          </linearGradient>
          <filter
            id="cm-glow"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* plot rectangle with subtle fill */}
        <rect
          x={margin}
          y={margin}
          width={plot}
          height={plot}
          rx={10}
          fill="url(#cm-bg)"
          stroke={QUADRANT_STROKE}
        />

        {/* axis lines — solid, more visible than before */}
        <line
          x1={margin}
          y1={cy}
          x2={size - margin}
          y2={cy}
          stroke={GRID_COLOR}
          strokeWidth={1}
        />
        <line
          x1={cx}
          y1={margin}
          x2={cx}
          y2={size - margin}
          stroke={GRID_COLOR}
          strokeWidth={1}
        />

        {/* center crosshair */}
        <circle cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.35)" />

        {/* outer halo — bigger and brighter for opinionated models */}
        <circle
          cx={dotX}
          cy={dotY}
          r={glowRadius}
          fill="var(--brand-blue)"
          opacity={glowOpacity * 0.5}
          filter="url(#cm-glow)"
        />
        {/* dot itself */}
        <circle
          cx={dotX}
          cy={dotY}
          r={7}
          fill="url(#cm-dot)"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={1.5}
        />

        {/* axis labels — pure SVG text, no CSS rotation gotchas */}
        <text
          x={cx}
          y={12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={LABEL_COLOR}
          fontSize={9}
          letterSpacing={1.6}
          fontWeight={500}
        >
          CONSERVATIVE
        </text>
        <text
          x={cx}
          y={size - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={LABEL_COLOR}
          fontSize={9}
          letterSpacing={1.6}
          fontWeight={500}
        >
          PROGRESSIVE
        </text>
        <text
          x={11}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-90 11 ${cy})`}
          fill={LABEL_COLOR}
          fontSize={9}
          letterSpacing={1.6}
          fontWeight={500}
        >
          COMMUNIST
        </text>
        <text
          x={size - 11}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90 ${size - 11} ${cy})`}
          fill={LABEL_COLOR}
          fontSize={9}
          letterSpacing={1.6}
          fontWeight={500}
        >
          CAPITALIST
        </text>
      </svg>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
