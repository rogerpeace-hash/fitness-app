import type { HeatmapDay } from "@/lib/workout-status";

function colorFor(count: number) {
  if (count <= 0) return "bg-surface-2";
  if (count === 1) return "bg-ignite/50";
  return "bg-ignite";
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
