"use client";

import { useState } from "react";
import { createGoal } from "@/lib/actions/goals";

type GoalType = "WEIGHT" | "BODY_FAT" | "EXERCISE";

export default function GoalForm() {
  const [type, setType] = useState<GoalType>("WEIGHT");
  const isExercise = type === "EXERCISE";

  return (
    <form action={createGoal} className="grid max-w-xl grid-cols-2 gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Type
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as GoalType)}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="WEIGHT">Weight</option>
          <option value="BODY_FAT">Body fat %</option>
          <option value="EXERCISE">Exercise (workouts/week)</option>
        </select>
      </label>
      <span />

      {!isExercise && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Start value
            <input
              type="number"
              step="0.1"
              name="startValue"
              required
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Start date
            <input
              type="date"
              name="startDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {isExercise ? "Workouts per week" : "Target value"}
        <input
          type="number"
          step={isExercise ? "1" : "0.1"}
          min={isExercise ? "1" : undefined}
          name="targetValue"
          required
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
      </label>
      {!isExercise && (
        <label className="flex flex-col gap-1 text-sm">
          Target date (optional)
          <input
            type="date"
            name="targetDate"
            className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      )}

      <label className="col-span-2 flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea
          name="notes"
          rows={2}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
      </label>
      <button
        type="submit"
        className="col-span-2 w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Add goal
      </button>
    </form>
  );
}
