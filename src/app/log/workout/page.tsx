import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { DEVICE_METRIC_FIELDS } from "@/lib/device-fields";
import type { RoutePoint } from "@/lib/geo";
import WorkoutForm from "./WorkoutForm";
import RouteCell from "./RouteCell";
import StravaSection from "./StravaSection";

const STRAVA_ERROR_MESSAGES: Record<string, string> = {
  denied: "Strava connection was cancelled.",
  invalid: "Something went wrong connecting to Strava — please try again.",
  token: "Strava didn't accept that connection — please try again.",
  sync_failed: "Couldn't sync from Strava — your connection may need to be reconnected.",
};

export default async function WorkoutLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; strava?: string; strava_synced?: string; strava_error?: string }>;
}) {
  const userId = await requireUserId();
  const { saved, strava, strava_synced, strava_error } = await searchParams;

  const [workouts, stravaConnection] = await Promise.all([
    prisma.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.stravaConnection.findUnique({ where: { userId } }),
  ]);

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
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Workouts</h1>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Saved.
        </p>
      )}
      {strava === "connected" && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Strava connected! Click &quot;Sync now&quot; below to bring in your activities.
        </p>
      )}
      {strava_synced !== undefined && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Synced {strava_synced} activit{strava_synced === "1" ? "y" : "ies"} from Strava.
        </p>
      )}
      {strava_error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {STRAVA_ERROR_MESSAGES[strava_error] ?? "Something went wrong with Strava."}
        </p>
      )}

      <Link
        href="/log/workout/track"
        className="w-fit rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
      >
        Record a walk or run with GPS →
      </Link>

      <StravaSection connection={stravaConnection} />

      <WorkoutForm />

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-hi">Recent workouts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
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
                <tr key={w.id} className="border-b border-border">
                  <td className="py-2 pr-4">{w.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{w.type}</td>
                  <td className="py-2 pr-4">{w.durationMin} min</td>
                  <td className="py-2 pr-4">{w.caloriesBurned ?? "—"}</td>
                  <td className="py-2 pr-4">{w.distanceKm !== null ? `${w.distanceKm} km` : "—"}</td>
                  <td className="py-2 pr-4">{w.trackedWith ?? "—"}</td>
                  <td className="py-2 pr-4 text-dim">{metricsSummary(w) ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {w.routePoints ? <RouteCell points={w.routePoints as unknown as RoutePoint[]} /> : "—"}
                  </td>
                </tr>
              ))}
              {workouts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 text-dim">
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
