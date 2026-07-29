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

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No weight entries yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="weightLb" name="Weight (lb)" stroke="#2563eb" dot={false} strokeWidth={2.5} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function NutritionChart({ data }: { data: NutritionPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No nutrition logs yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="calories" name="Calories" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
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
    return <p className="text-sm text-slate-500">No workouts yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        {weeklyTarget && (
          <ReferenceLine
            y={weeklyTarget}
            stroke="#64748b"
            strokeDasharray="4 4"
            label={{ value: `Goal: ${weeklyTarget}/wk`, fontSize: 11, fill: "#64748b" }}
          />
        )}
        <Bar dataKey="count" name="Workouts" radius={[4, 4, 0, 0]}>
          {data.map((point) => (
            <Cell key={point.weekLabel} fill={point.met ? "#16a34a" : "#eab308"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
