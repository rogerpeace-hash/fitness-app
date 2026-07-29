const DAY_MS = 24 * 60 * 60 * 1000;

function toUTCDateOnly(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function mondayOfWeekContaining(dayUTC: number): number {
  const dow = new Date(dayUTC).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7;
  return dayUTC - daysSinceMonday * DAY_MS;
}

export type WorkoutStatus = "green" | "yellow" | "red" | "none";

export interface WorkoutStatusResult {
  status: WorkoutStatus;
  currentWeekCount: number;
  daysSinceLastWorkout: number | null;
}

/**
 * RED once 3+ days have passed without a workout (regardless of weekly count).
 * GREEN once this week's count has met the weekly target.
 * YELLOW otherwise. "none" when there's no active weekly target to judge against.
 */
export function computeWorkoutStatus(
  workoutDates: Date[],
  weeklyTarget: number | null,
  today: Date = new Date()
): WorkoutStatusResult {
  const todayUTC = toUTCDateOnly(today);
  const dayNumbers = workoutDates.map(toUTCDateOnly);

  let daysSinceLastWorkout: number | null = null;
  if (dayNumbers.length > 0) {
    const mostRecent = Math.max(...dayNumbers);
    daysSinceLastWorkout = Math.round((todayUTC - mostRecent) / DAY_MS);
  }

  const weekStart = mondayOfWeekContaining(todayUTC);
  const weekEnd = weekStart + 7 * DAY_MS;
  const currentWeekCount = dayNumbers.filter((d) => d >= weekStart && d < weekEnd).length;

  let status: WorkoutStatus;
  if (!weeklyTarget) {
    status = "none";
  } else if (daysSinceLastWorkout === null || daysSinceLastWorkout >= 3) {
    status = "red";
  } else if (currentWeekCount >= weeklyTarget) {
    status = "green";
  } else {
    status = "yellow";
  }

  return { status, currentWeekCount, daysSinceLastWorkout };
}

export interface HeatmapDay {
  date: string;
  count: number;
}

/** Daily workout counts for the last `days` days (inclusive of today), oldest first. */
export function buildHeatmapDays(
  workoutDates: Date[],
  days: number,
  today: Date = new Date()
): HeatmapDay[] {
  const todayUTC = toUTCDateOnly(today);
  const counts = new Map<number, number>();
  for (const d of workoutDates) {
    const key = toUTCDateOnly(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayUTC = todayUTC - i * DAY_MS;
    result.push({
      date: new Date(dayUTC).toISOString().slice(0, 10),
      count: counts.get(dayUTC) ?? 0,
    });
  }
  return result;
}

export interface WeeklyBucket {
  weekLabel: string;
  count: number;
  met: boolean;
}

/** Workout counts per Mon-Sun week for the last `weeks` weeks, oldest first. */
export function buildWeeklyBuckets(
  workoutDates: Date[],
  weeklyTarget: number | null,
  weeks: number,
  today: Date = new Date()
): WeeklyBucket[] {
  const todayUTC = toUTCDateOnly(today);
  const currentWeekStart = mondayOfWeekContaining(todayUTC);
  const dayNumbers = workoutDates.map(toUTCDateOnly);

  const buckets: WeeklyBucket[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = currentWeekStart - w * 7 * DAY_MS;
    const weekEnd = weekStart + 7 * DAY_MS;
    const count = dayNumbers.filter((d) => d >= weekStart && d < weekEnd).length;
    buckets.push({
      weekLabel: new Date(weekStart).toISOString().slice(5, 10),
      count,
      met: weeklyTarget ? count >= weeklyTarget : false,
    });
  }
  return buckets;
}
