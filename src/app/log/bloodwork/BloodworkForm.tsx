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
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Lab name (optional)
          <input
            type="text"
            name="labName"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 text-xs font-medium text-dimmer">
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
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
            />
            <input
              type="number"
              step="any"
              name="markerValue[]"
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
            />
            <input
              type="text"
              name="markerUnit[]"
              placeholder="mg/dL"
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
            />
            <input
              type="number"
              step="any"
              name="markerRefLow[]"
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
            />
            <input
              type="number"
              step="any"
              name="markerRefHigh[]"
              className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-hi focus:border-ignite focus:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setRows((r) => [...r, { key: nextKey }]);
            setNextKey((k) => k + 1);
          }}
          className="w-fit text-sm text-dim hover:text-ignite"
        >
          + Add marker
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea
          name="notes"
          rows={2}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
        />
      </label>

      <button
        type="submit"
        className="w-fit rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
      >
        Save panel
      </button>
    </form>
  );
}
