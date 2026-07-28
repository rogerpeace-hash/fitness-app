import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createGoal, updateGoalStatus } from "@/lib/actions/goals";

const typeLabels: Record<string, string> = {
  WEIGHT: "Weight (kg)",
  BODY_FAT: "Body fat %",
  EXERCISE: "Exercise",
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const [goals, latestMetric] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.bodyMetric.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  const currentValueFor = (type: string) => {
    if (type === "WEIGHT") return latestMetric?.weightKg ?? null;
    if (type === "BODY_FAT") return latestMetric?.bodyFatPct ?? null;
    return null;
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Goals</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <form action={createGoal} className="grid max-w-xl grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Type
          <select
            name="type"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="WEIGHT">Weight</option>
            <option value="BODY_FAT">Body fat %</option>
            <option value="EXERCISE">Exercise</option>
          </select>
        </label>
        <span />
        <label className="flex flex-col gap-1 text-sm">
          Start value
          <input
            type="number"
            step="0.1"
            name="startValue"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Start date
          <input
            type="date"
            name="startDate"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Target value
          <input
            type="number"
            step="0.1"
            name="targetValue"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Target date (optional)
          <input
            type="date"
            name="targetDate"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm">
          Notes (optional)
          <textarea
            name="notes"
            rows={2}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="col-span-2 w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Add goal
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {goals.map((goal) => {
          const current = currentValueFor(goal.type);
          const total = Math.abs(goal.targetValue - goal.startValue);
          const progressed = current !== null ? Math.abs(current - goal.startValue) : null;
          const pct =
            total > 0 && progressed !== null
              ? Math.max(0, Math.min(100, Math.round((progressed / total) * 100)))
              : null;

          return (
            <div
              key={goal.id}
              className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{typeLabels[goal.type]}</span>
                <span className="text-xs uppercase text-zinc-500">{goal.status}</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {goal.startValue} → {goal.targetValue}
                {goal.targetDate && ` by ${goal.targetDate.toISOString().slice(0, 10)}`}
              </p>
              {pct !== null && (
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-black dark:bg-white"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              {goal.notes && (
                <p className="mt-2 text-sm text-zinc-500">{goal.notes}</p>
              )}
              {goal.status === "ACTIVE" && (
                <div className="mt-3 flex gap-3 text-sm">
                  <form action={updateGoalStatus.bind(null, goal.id, "ACHIEVED")}>
                    <button type="submit" className="text-green-700 underline dark:text-green-400">
                      Mark achieved
                    </button>
                  </form>
                  <form action={updateGoalStatus.bind(null, goal.id, "ABANDONED")}>
                    <button type="submit" className="text-zinc-500 underline">
                      Abandon
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {goals.length === 0 && <p className="text-zinc-500">No goals yet.</p>}
      </div>
    </div>
  );
}
