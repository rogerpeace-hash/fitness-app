"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { RoutePoint } from "@/lib/geo";

const RouteMap = dynamic(() => import("./track/RouteMap"), { ssr: false });

export default function RouteCell({ points }: { points: RoutePoint[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-blue-600 underline dark:text-blue-400">
        {open ? "Hide map" : "View map"}
      </button>
      {open && (
        <div className="mt-2 w-64">
          <RouteMap points={points} height={200} />
        </div>
      )}
    </div>
  );
}
