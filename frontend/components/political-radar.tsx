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
import { axisLabel } from "@/lib/politiscales";

type SeriesPoint = {
  axis: string;
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
};

export function PoliticalRadar({ axes, data, series, height = 420 }: Props) {
  // Pivot to wide format keyed by axis
  const byAxis = new Map<string, SeriesPoint>();
  for (const axis of axes) {
    byAxis.set(axis, { axis: axisLabel(axis) });
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
          dataKey="axis"
          tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
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
            dot={{ r: 2, fill: s.color, strokeWidth: 0 }}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
