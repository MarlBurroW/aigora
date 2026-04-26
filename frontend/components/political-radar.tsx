"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { axisColor, axisLabel } from "@/lib/politiscales";

type SeriesPoint = {
  /** Raw axis id — what dataKey points to + what payload.value will be in the
   *  custom tick / dot callbacks. We translate to a human label only at render. */
  axisId: string;
  [model: string]: string | number;
};

type Series = {
  modelKey: string;
  label: string;
  color: string;
};

type Props = {
  /** ordered list of axes to display on the chart (sets angular order) */
  axes: string[];
  /** one entry per (axis, model) — long format */
  data: Array<{ axis: string; model: string; score: number }>;
  /** describes each series (model) and its color */
  series: Series[];
  height?: number;
  /**
   * When true, each data dot is colored by the AXIS it sits on (rather than
   * by the series). Looks great for single-trace radars (model detail page);
   * disable for multi-model overlays where dot color = series color is
   * needed to tell the traces apart.
   */
  axisColoredDots?: boolean;
};

export function PoliticalRadar({
  axes,
  data,
  series,
  height = 420,
  axisColoredDots = false,
}: Props) {
  // Pivot to wide format keyed by raw axis id
  const byAxis = new Map<string, SeriesPoint>();
  for (const axis of axes) {
    byAxis.set(axis, { axisId: axis });
  }
  for (const row of data) {
    const point = byAxis.get(row.axis);
    if (point) point[row.model] = row.score;
  }
  const wide: SeriesPoint[] = axes.map((a) => byAxis.get(a)!);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={wide} outerRadius="78%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="axisId"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tick={ColoredAxisTick as any}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
          stroke="rgba(255,255,255,0.08)"
          angle={90}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(20,24,40,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            color: "white",
            fontSize: 12,
          }}
          // Translate the raw axis id back to its human label inside the tooltip
          labelFormatter={(label) =>
            typeof label === "string" ? axisLabel(label) : String(label ?? "")
          }
          formatter={(v: unknown) =>
            typeof v === "number" ? `${v.toFixed(1)}%` : String(v ?? "")
          }
        />
        {series.map((s) => (
          <Radar
            key={s.modelKey}
            name={s.label}
            dataKey={s.modelKey}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.18}
            strokeWidth={2}
            dot={
              axisColoredDots
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ((dotProps: DotProps) => (
                    <AxisColoredDot {...dotProps} seriesColor={s.color} />
                  )) as any
                : { r: 2, fill: s.color, strokeWidth: 0 }
            }
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── tick (axis label) ────────────────────────────────────────────────────────

type TickProps = {
  x?: number;
  y?: number;
  textAnchor?: "start" | "middle" | "end" | "inherit";
  payload?: { value?: string };
};

function ColoredAxisTick({ x = 0, y = 0, textAnchor, payload }: TickProps) {
  const id = payload?.value ?? "";
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dy={4}
      fill={axisColor(id)}
      fontSize={11}
      fontWeight={600}
      style={{
        // Slight glow so the label reads on top of the radar fill
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
      }}
    >
      {axisLabel(id)}
    </text>
  );
}

// ── dot ──────────────────────────────────────────────────────────────────────

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: { axisId?: string };
  seriesColor: string;
  key?: string | number;
};

function AxisColoredDot({ cx = 0, cy = 0, payload, seriesColor, key }: DotProps) {
  const id = payload?.axisId ?? "";
  const color = id ? axisColor(id) : seriesColor;
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="rgba(15,18,28,0.8)"
      strokeWidth={1.5}
    />
  );
}
