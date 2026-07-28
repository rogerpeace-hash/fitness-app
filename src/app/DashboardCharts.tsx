"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type WeightPoint = { date: string; weightKg: number; bodyFatPct?: number | null };
type NutritionPoint = { date: string; calories: number };

export function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">No weight entries yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#2563eb" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function NutritionChart({ data }: { data: NutritionPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">No nutrition logs yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="calories" name="Calories" fill="#16a34a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
