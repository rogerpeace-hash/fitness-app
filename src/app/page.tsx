import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { WeightChart, NutritionChart, WorkoutWeeklyChart } from "./DashboardCharts";
import WorkoutHeatmap from "./WorkoutHeatmap";
import SegmentalRadarChart, { type SegmentalPoint } from "./SegmentalRadarChart";
import { computeWorkoutStatus, buildHeatmapDays, buildWeeklyBuckets } from "@/lib/workout-status";

const typeLabels: Record<string, string> = {
  WEIGHT: "Weight (lb)",
  BODY_FAT: "Body fat %",
  EXERCISE: "Exercise",
};

const SEGMENTS = [
  { key: "rightArmLeanLb", label: "Right Arm" },
  { key: "leftArmLeanLb", label: "Left Arm" },
  { key: "trunkLeanLb", label: "Trunk" },
  { key: "rightLegLeanLb", label: "Right Leg" },
  { key: "leftLegLeanLb", label: "Left Leg" },
] as const;

export default async function DashboardPage() {
  const userId = await requireUserId();

  const since90d = new Date();
  since90d.setDate(since90d.getDate() - 90);
  const since14d = new Date();
  since14d.setDate(since14d.getDate() - 14);

  const since84d = new Date();
  since84d.setDate(since84d.getDate() - 84);

  const [weightEntries, nutritionByDay, activeGoals, latestScan, recentWorkouts, inBodyScans] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: { userId, date: { gte: since90d } },
      orderBy: { date: "asc" },
    }),
    prisma.nutritionLog.groupBy({
      by: ["date"],
      where: { userId, date: { gte: since14d } },
      _sum: { calories: true },
      orderBy: { date: "asc" },
    }),
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.inBodyScan.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: since84d } },
      orderBy: { date: "asc" },
      select: { date: true },
    }),
    prisma.inBodyScan.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const exerciseGoal = activeGoals.find((g) => g.type === "EXERCISE") ?? null;
  const weeklyTarget = exerciseGoal ? exerciseGoal.targetValue : null;
  const workoutDates = recentWorkouts.map((w) => w.date);
  const workoutStatusResult = computeWorkoutStatus(workoutDates, weeklyTarget);
  const heatmapDays = buildHeatmapDays(workoutDates, 84);
  const weeklyBuckets = buildWeeklyBuckets(workoutDates, weeklyTarget, 12);

  const statusStyles: Record<string, { dot: string; label: string; text: string }> = {
    green: { dot: "bg-green-500", label: "On track", text: "text-green-700 dark:text-green-400" },
    yellow: { dot: "bg-yellow-500", label: "Catching up", text: "text-yellow-700 dark:text-yellow-400" },
    red: { dot: "bg-red-500", label: "Missed 3+ days", text: "text-red-700 dark:text-red-400" },
    none: { dot: "bg-zinc-400", label: "No weekly goal set", text: "text-zinc-500" },
  };
  const workoutStatusStyle = statusStyles[workoutStatusResult.status];

  const latestMetric = weightEntries[weightEntries.length - 1];

  const weightChartData = weightEntries.map((e) => ({
    date: e.date.toISOString().slice(5, 10),
    weightLb: e.weightLb,
    bodyFatPct: e.bodyFatPct,
  }));

  const nutritionChartData = nutritionByDay.map((d) => ({
    date: d.date.toISOString().slice(5, 10),
    calories: Math.round(d._sum.calories ?? 0),
  }));

  const latestInBodyScan = inBodyScans[0];
  const segmentalRadarData: SegmentalPoint[] = latestInBodyScan
    ? SEGMENTS.map(({ key, label }) => {
        const latestValue = latestInBodyScan[key];
        const values = inBodyScans
          .map((s) => s[key])
          .filter((v): v is number => v !== null && v !== undefined);
        if (latestValue === null || latestValue === undefined || values.length === 0) return null;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { segment: label as string, pct: avg > 0 ? (latestValue / avg) * 100 : 100 };
      }).filter((p): p is SegmentalPoint => p !== null)
    : [];

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase text-zinc-500">Latest weight</p>
          <p className="text-2xl font-semibold">
            {latestMetric ? `${latestMetric.weightLb.toFixed(1)} lb` : "—"}
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase text-zinc-500">Latest body fat %</p>
          <p className="text-2xl font-semibold">
            {latestScan?.bodyFatPct ?? latestMetric?.bodyFatPct ?? "—"}
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase text-zinc-500">Active goals</p>
          <p className="text-2xl font-semibold">{activeGoals.length}</p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Workouts</h2>
          <Link href="/log/workout" className="text-sm text-zinc-500 underline hover:text-black dark:hover:text-white">
            Log a workout
          </Link>
        </div>
        <div className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${workoutStatusStyle.dot}`} />
              <span className={`text-sm font-medium ${workoutStatusStyle.text}`}>
                {workoutStatusStyle.label}
              </span>
            </div>
            <span className="text-sm text-zinc-500">
              {workoutStatusResult.currentWeekCount} this week
              {weeklyTarget ? ` / ${weeklyTarget} goal` : ""}
              {workoutStatusResult.daysSinceLastWorkout !== null &&
                ` · last workout ${workoutStatusResult.daysSinceLastWorkout === 0 ? "today" : `${workoutStatusResult.daysSinceLastWorkout}d ago`}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <WorkoutHeatmap days={heatmapDays} />
          </div>

          <WorkoutWeeklyChart data={weeklyBuckets} weeklyTarget={weeklyTarget} />

          {!weeklyTarget && (
            <p className="text-sm text-zinc-500">
              Set a weekly workout goal on the{" "}
              <Link href="/goals" className="underline">
                goals page
              </Link>{" "}
              to get a green/yellow/red status here.
            </p>
          )}
        </div>
      </section>

      {latestInBodyScan && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Body Composition (InBody)</h2>
            <Link href="/log/inbody" className="text-sm text-zinc-500 underline hover:text-black dark:hover:text-white">
              Log a scan
            </Link>
          </div>
          <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-4 flex flex-wrap gap-6 text-sm">
              {latestInBodyScan.inBodyScore !== null && (
                <div>
                  <span className="text-zinc-500">InBody Score </span>
                  <span className="font-semibold">{latestInBodyScan.inBodyScore}</span>
                </div>
              )}
              {latestInBodyScan.visceralFatLevel !== null && (
                <div>
                  <span className="text-zinc-500">Visceral Fat Level </span>
                  <span
                    className={`font-semibold ${
                      latestInBodyScan.visceralFatLevel >= 10
                        ? "text-red-600 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {latestInBodyScan.visceralFatLevel}
                  </span>
                </div>
              )}
            </div>
            <SegmentalRadarChart data={segmentalRadarData} />
            {segmentalRadarData.length > 0 && (
              <p className="mt-2 text-xs text-zinc-500">
                Each segment shown as % of your own historical average — 100% is your norm,
                not a clinical ideal.
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Weight trend (90 days)</h2>
        <WeightChart data={weightChartData} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Nutrition (14 days)</h2>
        <NutritionChart data={nutritionChartData} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Active goals</h2>
          <Link href="/goals" className="text-sm text-zinc-500 underline hover:text-black dark:hover:text-white">
            Manage goals
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {activeGoals.map((goal) => {
            const current =
              goal.type === "WEIGHT"
                ? latestMetric?.weightLb
                : goal.type === "BODY_FAT"
                  ? latestScan?.bodyFatPct ?? latestMetric?.bodyFatPct
                  : null;
            const total = Math.abs(goal.targetValue - goal.startValue);
            const progressed = current != null ? Math.abs(current - goal.startValue) : null;
            const pct =
              total > 0 && progressed !== null
                ? Math.max(0, Math.min(100, Math.round((progressed / total) * 100)))
                : null;
            return (
              <div key={goal.id} className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{typeLabels[goal.type]}</span>
                  <span className="text-zinc-500">
                    {goal.type === "EXERCISE"
                      ? `${goal.targetValue} workouts / week`
                      : `${goal.startValue} → ${goal.targetValue}`}
                  </span>
                </div>
                {pct !== null && (
                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-2 rounded-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
          {activeGoals.length === 0 && (
            <p className="text-sm text-zinc-500">
              No active goals. <Link href="/goals" className="underline">Add one</Link>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
