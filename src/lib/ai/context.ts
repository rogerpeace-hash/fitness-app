import { prisma } from "@/lib/prisma";
import { computeWorkoutStatus } from "@/lib/workout-status";

const SEGMENTS = [
  { key: "rightArmLeanLb", label: "Right Arm" },
  { key: "leftArmLeanLb", label: "Left Arm" },
  { key: "trunkLeanLb", label: "Trunk" },
  { key: "rightLegLeanLb", label: "Right Leg" },
  { key: "leftLegLeanLb", label: "Left Leg" },
] as const;

export async function buildUserContext(userId: string): Promise<string> {
  const since30d = new Date();
  since30d.setDate(since30d.getDate() - 30);
  const since14d = new Date();
  since14d.setDate(since14d.getDate() - 14);
  const since84d = new Date();
  since84d.setDate(since84d.getDate() - 84);

  const [
    recentWeights,
    inBodyScans,
    nutritionLogs,
    recentWorkouts,
    activeGoals,
    recentJournal,
  ] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: { userId, date: { gte: since30d } },
      orderBy: { date: "asc" },
    }),
    prisma.inBodyScan.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.nutritionLog.findMany({
      where: { userId, date: { gte: since14d } },
    }),
    prisma.workout.findMany({
      where: { userId, date: { gte: since84d } },
      orderBy: { date: "asc" },
    }),
    prisma.goal.findMany({ where: { userId, status: "ACTIVE" } }),
    prisma.journalEntry.findMany({
      where: { userId, date: { gte: since14d } },
      orderBy: { date: "desc" },
    }),
  ]);

  const lines: string[] = [];

  // Weight trend
  if (recentWeights.length > 0) {
    const latest = recentWeights[recentWeights.length - 1];
    const earliest = recentWeights[0];
    const delta = latest.weightLb - earliest.weightLb;
    lines.push(
      `Weight: ${latest.weightLb.toFixed(1)} lb as of ${latest.date.toISOString().slice(0, 10)}` +
        (recentWeights.length > 1
          ? ` (${delta >= 0 ? "+" : ""}${delta.toFixed(1)} lb over the last 30 days)`
          : "")
    );
    if (latest.bodyFatPct != null) lines.push(`Body fat: ${latest.bodyFatPct}%`);
  } else {
    lines.push("No recent weight entries logged.");
  }

  // InBody segmental analysis
  if (inBodyScans.length > 0) {
    const latest = inBodyScans[0];
    lines.push(
      `\nLatest InBody scan (${latest.date.toISOString().slice(0, 10)}): Score ${latest.inBodyScore ?? "n/a"}, ` +
        `Visceral Fat Level ${latest.visceralFatLevel ?? "n/a"}${
          latest.visceralFatLevel != null && latest.visceralFatLevel >= 10 ? " (above the recommended <10)" : ""
        }.`
    );
    const segmentalNotes: string[] = [];
    for (const { key, label } of SEGMENTS) {
      const latestValue = latest[key];
      const values = inBodyScans.map((s) => s[key]).filter((v): v is number => v !== null);
      if (latestValue == null || values.length === 0) continue;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const pct = avg > 0 ? (latestValue / avg) * 100 : 100;
      if (pct <= 92) segmentalNotes.push(`${label} lean mass is below your own average (${pct.toFixed(0)}%)`);
      else if (pct >= 108) segmentalNotes.push(`${label} lean mass is above your own average (${pct.toFixed(0)}%)`);
    }
    if (segmentalNotes.length > 0) {
      lines.push(`Segmental notes: ${segmentalNotes.join("; ")}.`);
    }
    if (latest.trunkFatLb != null) {
      lines.push(`Trunk (midsection/waist) fat mass: ${latest.trunkFatLb} lb.`);
    }
  } else {
    lines.push("\nNo InBody scans logged yet.");
  }

  // Nutrition
  if (nutritionLogs.length > 0) {
    const days = new Set(nutritionLogs.map((n) => n.date.toISOString().slice(0, 10))).size;
    const sum = (f: (n: (typeof nutritionLogs)[number]) => number | null) =>
      nutritionLogs.reduce((a, n) => a + (f(n) ?? 0), 0);
    const avgCalories = sum((n) => n.calories) / days;
    const avgProtein = sum((n) => n.proteinG) / days;
    const avgCarbs = sum((n) => n.carbsG) / days;
    const avgFat = sum((n) => n.fatG) / days;
    lines.push(
      `\nNutrition (last ${days} logged day${days === 1 ? "" : "s"}): avg ${Math.round(avgCalories)} kcal/day, ` +
        `${avgProtein.toFixed(0)}g protein, ${avgCarbs.toFixed(0)}g carbs, ${avgFat.toFixed(0)}g fat.`
    );
    const latestWeight = recentWeights[recentWeights.length - 1]?.weightLb;
    if (latestWeight && avgProtein > 0) {
      const proteinPerLb = avgProtein / latestWeight;
      if (proteinPerLb < 0.6) {
        lines.push(
          `Protein looks low relative to bodyweight (${proteinPerLb.toFixed(2)}g/lb; a common general-fitness target is ~0.7-1g/lb).`
        );
      }
    }
  } else {
    lines.push("\nNo nutrition logs in the last 14 days.");
  }

  // Workouts
  const exerciseGoal = activeGoals.find((g) => g.type === "EXERCISE");
  const workoutStatus = computeWorkoutStatus(
    recentWorkouts.map((w) => w.date),
    exerciseGoal ? exerciseGoal.targetValue : null
  );
  const workoutTypeCounts = recentWorkouts.reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1;
    return acc;
  }, {});
  const topTypes = Object.entries(workoutTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${type} (${count})`)
    .join(", ");
  lines.push(
    `\nWorkouts: ${recentWorkouts.length} logged in the last 12 weeks${topTypes ? ` — most common: ${topTypes}` : ""}. ` +
      `${workoutStatus.currentWeekCount} so far this week` +
      (exerciseGoal ? ` (goal: ${exerciseGoal.targetValue}/week, status: ${workoutStatus.status})` : " (no weekly goal set)") +
      "."
  );

  // Goals
  if (activeGoals.length > 0) {
    lines.push(
      `\nActive goals: ` +
        activeGoals
          .map((g) =>
            g.type === "EXERCISE"
              ? `${g.targetValue} workouts/week`
              : `${g.type === "WEIGHT" ? "Weight" : "Body fat %"} ${g.startValue} → ${g.targetValue}`
          )
          .join("; ")
    );
  }

  // Journal / mood
  if (recentJournal.length > 0) {
    const rated = recentJournal.filter((j) => j.moodRating != null);
    if (rated.length > 0) {
      const avgMood = rated.reduce((a, j) => a + (j.moodRating ?? 0), 0) / rated.length;
      lines.push(`\nRecent mood (last 14 days, ${rated.length} entries): avg ${avgMood.toFixed(1)}/5.`);
    }
  }

  return lines.join("\n");
}
