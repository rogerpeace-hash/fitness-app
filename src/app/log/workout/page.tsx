import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { DEVICE_METRIC_FIELDS } from "@/lib/device-fields";
import type { RoutePoint } from "@/lib/geo";
import WorkoutForm from "./WorkoutForm";
import RouteCell from "./RouteCell";

export default async function WorkoutLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const workouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });

  const metricsSummary = (w: (typeof workouts)[number]) => {
    if (!w.trackedWith) return null;
    const fieldDefs = DEVICE_METRIC_FIELDS[w.trackedWith] ?? [];
    const metrics = (w.metrics as Record<string, number> | null) ?? {};
    const parts = fieldDefs
      .filter((f) => metrics[f.key] !== undefined)
      .map((f) => `${f.label}: ${metrics[f.key]}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Workouts</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <Link
        href="/log/workout/track"
        className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Record a walk or run with GPS →
      </Link>

      <WorkoutForm />

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent workouts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Calories</th>
                <th className="py-2 pr-4">Distance</th>
                <th className="py-2 pr-4">Device</th>
                <th className="py-2 pr-4">Metrics</th>
                <th className="py-2 pr-4">Route</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w.id} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="py-2 pr-4">{w.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{w.type}</td>
                  <td className="py-2 pr-4">{w.durationMin} min</td>
                  <td className="py-2 pr-4">{w.caloriesBurned ?? "—"}</td>
                  <td className="py-2 pr-4">{w.distanceKm !== null ? `${w.distanceKm} km` : "—"}</td>
                  <td className="py-2 pr-4">{w.trackedWith ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-500">{metricsSummary(w) ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {w.routePoints ? <RouteCell points={w.routePoints as unknown as RoutePoint[]} /> : "—"}
                  </td>
                </tr>
              ))}
              {workouts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-slate-500">
                    No workouts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
