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
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Bloodwork</h1>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Saved.
        </p>
      )}

      <BloodworkForm />

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-hi">Recent panels</h2>
        <div className="flex flex-col gap-6">
          {panels.map((panel) => (
            <div
              key={panel.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-medium">{panel.date.toISOString().slice(0, 10)}</span>
                {panel.labName && (
                  <span className="text-sm text-dim">{panel.labName}</span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
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
                      <tr key={marker.id} className="border-b border-border">
                        <td className="py-1 pr-4">{marker.name}</td>
                        <td className={`py-1 pr-4 ${outOfRange ? "font-semibold text-red-400" : ""}`}>
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
          {panels.length === 0 && <p className="text-dim">No panels yet.</p>}
        </div>
      </div>
    </div>
  );
}
