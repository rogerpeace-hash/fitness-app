"use client";

import { useState } from "react";
import { createBloodworkPanel } from "@/lib/actions/bloodwork";

type Row = { key: number };

export default function BloodworkForm() {
  const [rows, setRows] = useState<Row[]>([{ key: 0 }, { key: 1 }, { key: 2 }]);
  const [nextKey, setNextKey] = useState(3);

  return (
    <form action={createBloodworkPanel} className="flex flex-col gap-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Lab name (optional)
          <input
            type="text"
            name="labName"
            className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 text-xs font-medium text-slate-500">
          <span>Marker</span>
          <span>Value</span>
          <span>Unit</span>
          <span>Ref low</span>
          <span>Ref high</span>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2">
            <input
              type="text"
              name="markerName[]"
              placeholder="e.g. LDL Cholesterol"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="number"
              step="any"
              name="markerValue[]"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="text"
              name="markerUnit[]"
              placeholder="mg/dL"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="number"
              step="any"
              name="markerRefLow[]"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="number"
              step="any"
              name="markerRefHigh[]"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setRows((r) => [...r, { key: nextKey }]);
            setNextKey((k) => k + 1);
          }}
          className="w-fit text-sm text-slate-500 underline hover:text-blue-600 dark:hover:text-blue-400"
        >
          + Add marker
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea
          name="notes"
          rows={2}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Save panel
      </button>
    </form>
  );
}
