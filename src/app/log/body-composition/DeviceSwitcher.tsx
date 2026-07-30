"use client";

import { useState, type ReactNode } from "react";

export default function DeviceSwitcher({
  inbody,
  renpho,
  initialDevice = "InBody",
}: {
  inbody: ReactNode;
  renpho: ReactNode;
  initialDevice?: "InBody" | "Renpho";
}) {
  const [device, setDevice] = useState<"InBody" | "Renpho">(initialDevice);

  return (
    <div className="flex flex-col gap-6">
      <label className="flex max-w-xs flex-col gap-1 text-sm">
        Device
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value as "InBody" | "Renpho")}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="InBody">InBody</option>
          <option value="Renpho">Renpho</option>
        </select>
      </label>

      {device === "InBody" ? inbody : renpho}
    </div>
  );
}
