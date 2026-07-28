import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { WeightChart, NutritionChart } from "./DashboardCharts";

const typeLabels: Record<string, string> = {
  WEIGHT: "Weight (kg)",
  BODY_FAT: "Body fat %",
  EXERCISE: "Exercise",
};

export default async function DashboardPage() {
  const userId = await requireUserId();

  const since90d = new Date();
  since90d.setDate(since90d.getDate() - 90);
  const since14d = new Date();
  since14d.setDate(since14d.getDate() - 14);

  const [weightEntries, nutritionByDay, activeGoals, latestScan] = await Promise.all([
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
  ]);

  const latestMetric = weightEntries[weightEntries.length - 1];

  const weightChartData = weightEntries.map((e) => ({
    date: e.date.toISOString().slice(5, 10),
    weightKg: e.weightKg,
    bodyFatPct: e.bodyFatPct,
  }));

  const nutritionChartData = nutritionByDay.map((d) => ({
    date: d.date.toISOString().slice(5, 10),
    calories: Math.round(d._sum.calories ?? 0),
  }));

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase text-zinc-500">Latest weight</p>
          <p className="text-2xl font-semibold">
            {latestMetric ? `${latestMetric.weightKg} kg` : "—"}
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
                ? latestMetric?.weightKg
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
                    {goal.startValue} → {goal.targetValue}
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
