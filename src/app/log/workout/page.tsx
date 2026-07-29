import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createWorkout } from "@/lib/actions/workout";

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

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Workouts</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <form action={createWorkout} className="grid max-w-xl grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Type
          <input
            type="text"
            name="type"
            required
            placeholder="e.g. Run, Lift, Yoga"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Duration (min)
          <input
            type="number"
            step="1"
            name="durationMin"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Calories burned (optional)
          <input
            type="number"
            step="1"
            name="caloriesBurned"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm">
          Distance (km, optional)
          <input
            type="number"
            step="0.01"
            name="distanceKm"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="col-span-2 w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Save workout
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent workouts</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Duration</th>
              <th className="py-2 pr-4">Calories</th>
              <th className="py-2 pr-4">Distance</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((w) => (
              <tr key={w.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4">{w.date.toISOString().slice(0, 10)}</td>
                <td className="py-2 pr-4">{w.type}</td>
                <td className="py-2 pr-4">{w.durationMin} min</td>
                <td className="py-2 pr-4">{w.caloriesBurned ?? "—"}</td>
                <td className="py-2 pr-4">{w.distanceKm ?? "—"}</td>
              </tr>
            ))}
            {workouts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-zinc-500">
                  No workouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
