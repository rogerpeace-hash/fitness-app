"use client";

import { useState } from "react";
import { createGoal } from "@/lib/actions/goals";

type GoalType = "WEIGHT" | "BODY_FAT" | "EXERCISE" | "EXERCISE_REPS";

const EXERCISE_PRESETS = [
  "Strict Pull-ups",
  "Chin-ups",
  "Push-ups",
  "Sit-ups",
  "Bodyweight Squats",
  "Dips",
  "Burpees",
  "Lunges (per leg)",
];

export default function GoalForm() {
  const [type, setType] = useState<GoalType>("WEIGHT");
  const [exercise, setExercise] = useState(EXERCISE_PRESETS[0]);
  const [customExercise, setCustomExercise] = useState("");
  const isFrequencyGoal = type === "EXERCISE";
  const isRepsGoal = type === "EXERCISE_REPS";

  return (
    <form action={createGoal} className="grid max-w-xl grid-cols-2 gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Type
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as GoalType)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        >
          <option value="WEIGHT">Weight</option>
          <option value="BODY_FAT">Body fat %</option>
          <option value="EXERCISE">Exercise frequency (workouts/week)</option>
          <option value="EXERCISE_REPS">Exercise max reps (e.g. pull-ups)</option>
        </select>
      </label>
      <span />

      {isRepsGoal && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Exercise
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
            >
              {EXERCISE_PRESETS.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
              <option value="Other">Other…</option>
            </select>
          </label>
          {exercise === "Other" ? (
            <label className="flex flex-col gap-1 text-sm">
              Custom exercise name
              <input
                type="text"
                value={customExercise}
                onChange={(e) => setCustomExercise(e.target.value)}
                placeholder="e.g. Muscle-ups"
                className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
              />
            </label>
          ) : (
            <span />
          )}
          <input type="hidden" name="exerciseName" value={exercise === "Other" ? customExercise : exercise} />
        </>
      )}

      {!isFrequencyGoal && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            {isRepsGoal ? "Current max reps" : "Start value"}
            <input
              type="number"
              step={isRepsGoal ? "1" : "0.1"}
              name="startValue"
              required
              className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Start date
            <input
              type="date"
              name="startDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {isFrequencyGoal ? "Workouts per week" : isRepsGoal ? "Target reps" : "Target value"}
        <input
          type="number"
          step={isFrequencyGoal || isRepsGoal ? "1" : "0.1"}
          min={isFrequencyGoal ? "1" : undefined}
          name="targetValue"
          required
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      {!isFrequencyGoal && (
        <label className="flex flex-col gap-1 text-sm">
          Target date {isRepsGoal ? "" : "(optional)"}
          <input
            type="date"
            name="targetDate"
            required={isRepsGoal}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
      )}

      <label className="col-span-2 flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea
          name="notes"
          rows={2}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      <button
        type="submit"
        className="col-span-2 w-fit rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
      >
        Add goal
      </button>
    </form>
  );
}
