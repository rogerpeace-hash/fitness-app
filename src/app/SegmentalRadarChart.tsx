"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

export type SegmentalPoint = { segment: string; pct: number };

export default function SegmentalRadarChart({ data }: { data: SegmentalPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Not enough InBody scans yet for a segmental comparison.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid className="stroke-slate-200 dark:stroke-slate-800" />
        <PolarAngleAxis dataKey="segment" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[60, 140]} tick={{ fontSize: 10 }} tickCount={5} />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(0)}%`, "vs. your average"]}
        />
        <Radar
          name="Lean mass vs. your average"
          dataKey="pct"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
