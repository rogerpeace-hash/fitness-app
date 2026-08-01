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
    return <p className="text-sm text-dim">Not enough InBody scans yet for a segmental comparison.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis dataKey="segment" tick={{ fontSize: 12, fill: "#9da5b1" }} />
        <PolarRadiusAxis angle={90} domain={[60, 140]} tick={{ fontSize: 10, fill: "#6b727e" }} tickCount={5} />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(0)}%`, "vs. your average"]}
          contentStyle={{ background: "#111826", border: "1px solid #283040", borderRadius: 10, color: "#f1f5fc", fontSize: 13 }}
        />
        <Radar
          name="Lean mass vs. your average"
          dataKey="pct"
          stroke="#ff7333"
          fill="#ff7333"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
