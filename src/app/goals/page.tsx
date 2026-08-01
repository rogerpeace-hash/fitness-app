import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { updateGoalStatus, logGoalProgress } from "@/lib/actions/goals";
import GoalForm from "./GoalForm";

const typeLabels: Record<string, string> = {
  WEIGHT: "Weight (lb)",
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
      include: {
        progressLogs: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    }),
    prisma.bodyMetric.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),
  ]);

  const currentValueFor = (goal: (typeof goals)[number]) => {
    if (goal.type === "WEIGHT") return latestMetric?.weightLb ?? null;
    if (goal.type === "BODY_FAT") return latestMetric?.bodyFatPct ?? null;
    if (goal.type === "EXERCISE_REPS") return goal.progressLogs[0]?.value ?? null;
    return null;
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Goals</h1>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Saved.
        </p>
      )}

      <GoalForm />

      <div className="flex flex-col gap-4">
        {goals.map((goal) => {
          const current = currentValueFor(goal);
          const total = Math.abs(goal.targetValue - goal.startValue);
          const progressed = current !== null ? Math.abs(current - goal.startValue) : null;
          const pct =
            total > 0 && progressed !== null
              ? Math.max(0, Math.min(100, Math.round((progressed / total) * 100)))
              : null;
          const isRepsGoal = goal.type === "EXERCISE_REPS";

          return (
            <div
              key={goal.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">
                  {isRepsGoal ? goal.exerciseName : typeLabels[goal.type]}
                </span>
                <span className="text-xs font-semibold uppercase text-dimmer">{goal.status}</span>
              </div>
              <p className="text-sm text-dim">
                {goal.type === "EXERCISE"
                  ? `${goal.targetValue} workouts / week`
                  : isRepsGoal
                    ? `${current ?? goal.startValue} → ${goal.targetValue} reps`
                    : `${goal.startValue} → ${goal.targetValue}`}
                {goal.targetDate && ` by ${goal.targetDate.toISOString().slice(0, 10)}`}
              </p>
              {pct !== null && (
                <div className="mt-2 h-2 w-full rounded-full bg-surface-2">
                  <div
                    className="h-2 rounded-full bg-ignite"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              {goal.notes && (
                <p className="mt-2 text-sm text-dim">{goal.notes}</p>
              )}

              {isRepsGoal && goal.status === "ACTIVE" && (
                <div className="mt-3 rounded-lg bg-surface-2 p-3">
                  <form action={logGoalProgress} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="goalId" value={goal.id} />
                    <label className="flex flex-col gap-1 text-xs">
                      Date
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="rounded-lg border border-border bg-bg px-2 py-1 text-sm text-hi focus:border-ignite focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      Reps today
                      <input
                        type="number"
                        step="1"
                        name="value"
                        required
                        className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm text-hi focus:border-ignite focus:outline-none"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-lg bg-ignite px-3 py-1.5 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
                    >
                      Log
                    </button>
                  </form>
                  {goal.progressLogs.length > 0 && (
                    <p className="mt-2 text-xs text-dimmer">
                      Recent: {goal.progressLogs.map((p) => `${p.value} (${p.date.toISOString().slice(5, 10)})`).join(", ")}
                    </p>
                  )}
                </div>
              )}

              {goal.status === "ACTIVE" && (
                <div className="mt-3 flex gap-3 text-sm">
                  <form action={updateGoalStatus.bind(null, goal.id, "ACHIEVED")}>
                    <button type="submit" className="text-surge hover:brightness-110">
                      Mark achieved
                    </button>
                  </form>
                  <form action={updateGoalStatus.bind(null, goal.id, "ABANDONED")}>
                    <button type="submit" className="text-dim underline">
                      Abandon
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {goals.length === 0 && <p className="text-dim">No goals yet.</p>}
      </div>
    </div>
  );
}
