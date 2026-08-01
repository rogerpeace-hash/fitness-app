"use client";

import { useState } from "react";
import { createWorkout } from "@/lib/actions/workout";
import { DEVICE_METRIC_FIELDS, DEVICE_OPTIONS } from "@/lib/device-fields";

export default function WorkoutForm() {
  const [device, setDevice] = useState("");
  const metricFields = DEVICE_METRIC_FIELDS[device] ?? [];

  return (
    <form action={createWorkout} className="grid max-w-xl grid-cols-2 gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Date
        <input
          type="date"
          name="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Type
        <input
          type="text"
          name="type"
          required
          placeholder="e.g. Run, Lift, Yoga"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Duration (min)
        <input
          type="number"
          step="1"
          name="durationMin"
          required
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Calories burned (optional)
        <input
          type="number"
          step="1"
          name="caloriesBurned"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Distance (km, optional)
        <input
          type="number"
          step="0.01"
          name="distanceKm"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tracked with (optional)
        <select
          name="trackedWith"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        >
          {DEVICE_OPTIONS.map((option) => (
            <option key={option || "none"} value={option}>
              {option || "— none —"}
            </option>
          ))}
        </select>
      </label>

      {metricFields.length > 0 && (
        <div className="col-span-2 grid grid-cols-2 gap-4 rounded-lg border border-border p-3">
          {metricFields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-sm">
              {field.label}
              <input
                type="number"
                step={field.step ?? "1"}
                name={`metric_${field.key}`}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
              />
            </label>
          ))}
        </div>
      )}

      <button
        type="submit"
        className="col-span-2 w-fit rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
      >
        Save workout
      </button>
    </form>
  );
}
