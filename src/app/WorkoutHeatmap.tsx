import type { HeatmapDay } from "@/lib/workout-status";

function colorFor(count: number) {
  if (count <= 0) return "bg-slate-100 dark:bg-slate-800";
  if (count === 1) return "bg-green-400 dark:bg-green-600";
  return "bg-green-700 dark:bg-green-400";
}

export default function WorkoutHeatmap({ days }: { days: HeatmapDay[] }) {
  return (
    <div
      className="grid w-fit gap-1"
      style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column" }}
    >
      {days.map((day) => (
        <div
          key={day.date}
          title={`${day.date}: ${day.count} workout${day.count === 1 ? "" : "s"}`}
          className={`h-3.5 w-3.5 rounded-sm ${colorFor(day.count)}`}
        />
      ))}
    </div>
  );
}
