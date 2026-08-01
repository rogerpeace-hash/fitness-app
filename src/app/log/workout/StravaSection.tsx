import { syncStrava, disconnectStrava } from "@/lib/actions/strava";

export default function StravaSection({
  connection,
}: {
  connection: { athleteId: string; lastSyncedAt: Date | null } | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      {connection ? (
        <>
          <span className="text-sm text-dim">
            Strava connected
            {connection.lastSyncedAt && ` · last synced ${connection.lastSyncedAt.toISOString().slice(0, 16).replace("T", " ")}`}
          </span>
          <form action={syncStrava}>
            <button
              type="submit"
              className="rounded-lg bg-ignite px-3 py-1.5 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
            >
              Sync now
            </button>
          </form>
          <form action={disconnectStrava}>
            <button type="submit" className="text-sm text-dim underline">
              Disconnect
            </button>
          </form>
        </>
      ) : (
        <>
          <span className="text-sm text-dim">
            Automatically bring in runs and rides recorded with Garmin (or anything else) synced to Strava.
          </span>
          <a
            href="/api/strava/connect"
            className="rounded-lg bg-ignite px-3 py-1.5 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
          >
            Connect Strava
          </a>
        </>
      )}
    </div>
  );
}
