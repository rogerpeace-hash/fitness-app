"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type WeightPoint = { date: string; weightLb: number; bodyFatPct?: number | null };
type NutritionPoint = { date: string; calories: number };
type WeeklyWorkoutPoint = { weekLabel: string; count: number; met: boolean };

const tooltipStyle = {
  background: "#111826",
  border: "1px solid #283040",
  borderRadius: 10,
  color: "#f1f5fc",
  fontSize: 13,
};
const tickStyle = { fontSize: 12, fill: "#6b727e" };

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-dim">No weight entries yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={tickStyle} />
        <YAxis tick={tickStyle} domain={["auto", "auto"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 13, color: "#9da5b1" }} />
        <Line type="monotone" dataKey="weightLb" name="Weight (lb)" stroke="#ff7333" dot={false} strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function NutritionChart({ data }: { data: NutritionPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-dim">No nutrition logs yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={tickStyle} />
        <YAxis tick={tickStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="calories" name="Calories" fill="#6ab3fd" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WorkoutWeeklyChart({
  data,
  weeklyTarget,
}: {
  data: WeeklyWorkoutPoint[];
  weeklyTarget: number | null;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-dim">No workouts yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="weekLabel" tick={tickStyle} />
        <YAxis tick={tickStyle} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {weeklyTarget && (
          <ReferenceLine
            y={weeklyTarget}
            stroke="#6b727e"
            strokeDasharray="4 4"
            label={{ value: `Goal: ${weeklyTarget}/wk`, fontSize: 11, fill: "#6b727e" }}
          />
        )}
        <Bar dataKey="count" name="Workouts" radius={[4, 4, 0, 0]}>
          {data.map((point) => (
            <Cell key={point.weekLabel} fill={point.met ? "#5be479" : "#ff7333"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
