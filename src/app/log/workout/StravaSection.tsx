import { syncStrava, disconnectStrava } from "@/lib/actions/strava";

export default function StravaSection({
  connection,
}: {
  connection: { athleteId: string; lastSyncedAt: Date | null } | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {connection ? (
        <>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Strava connected
            {connection.lastSyncedAt && ` · last synced ${connection.lastSyncedAt.toISOString().slice(0, 16).replace("T", " ")}`}
          </span>
          <form action={syncStrava}>
            <button
              type="submit"
              className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
            >
              Sync now
            </button>
          </form>
          <form action={disconnectStrava}>
            <button type="submit" className="text-sm text-slate-500 underline">
              Disconnect
            </button>
          </form>
        </>
      ) : (
        <>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Automatically bring in runs and rides recorded with Garmin (or anything else) synced to Strava.
          </span>
          <a
            href="/api/strava/connect"
            className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
          >
            Connect Strava
          </a>
        </>
      )}
    </div>
  );
}
