import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import BloodworkForm from "./BloodworkForm";

export default async function BloodworkLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const panels = await prisma.bloodworkPanel.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 10,
    include: { markers: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Bloodwork</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <BloodworkForm />

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent panels</h2>
        <div className="flex flex-col gap-6">
          {panels.map((panel) => (
            <div
              key={panel.id}
              className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-medium">{panel.date.toISOString().slice(0, 10)}</span>
                {panel.labName && (
                  <span className="text-sm text-zinc-500">{panel.labName}</span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                    <th className="py-1 pr-4">Marker</th>
                    <th className="py-1 pr-4">Value</th>
                    <th className="py-1 pr-4">Unit</th>
                    <th className="py-1 pr-4">Reference range</th>
                  </tr>
                </thead>
                <tbody>
                  {panel.markers.map((marker) => {
                    const outOfRange =
                      (marker.refLow !== null && marker.value < marker.refLow) ||
                      (marker.refHigh !== null && marker.value > marker.refHigh);
                    return (
                      <tr key={marker.id} className="border-b border-zinc-100 dark:border-zinc-900">
                        <td className="py-1 pr-4">{marker.name}</td>
                        <td className={`py-1 pr-4 ${outOfRange ? "font-semibold text-red-600 dark:text-red-400" : ""}`}>
                          {marker.value}
                        </td>
                        <td className="py-1 pr-4">{marker.unit ?? "—"}</td>
                        <td className="py-1 pr-4">
                          {marker.refLow ?? "—"} – {marker.refHigh ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
          {panels.length === 0 && <p className="text-zinc-500">No panels yet.</p>}
        </div>
      </div>
    </div>
  );
}
