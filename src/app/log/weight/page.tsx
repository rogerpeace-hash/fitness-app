import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createBodyMetric, deleteBodyMetric } from "@/lib/actions/body-metric";

export default async function WeightLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const entries = await prisma.bodyMetric.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Weight &amp; Measurements</h1>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Saved.
        </p>
      )}

      <form action={createBodyMetric} className="grid max-w-xl grid-cols-2 gap-4">
        <label className="col-span-2 flex flex-col gap-1 text-sm">
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
          Weight (lb)
          <input
            type="number"
            step="0.1"
            name="weightLb"
            required
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Body fat % (optional)
          <input
            type="number"
            step="0.1"
            name="bodyFatPct"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Neck (in, optional)
          <input
            type="number"
            step="0.1"
            name="neckIn"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Waist (in, optional)
          <input
            type="number"
            step="0.1"
            name="waistIn"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hip (in, optional)
          <input
            type="number"
            step="0.1"
            name="hipIn"
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>
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
          Save entry
        </button>
      </form>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-hi">Recent entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Weight (lb)</th>
                <th className="py-2 pr-4">Body fat %</th>
                <th className="py-2 pr-4">Waist</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border">
                  <td className="py-2 pr-4">{entry.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{entry.weightLb.toFixed(1)}</td>
                  <td className="py-2 pr-4">{entry.bodyFatPct ?? "—"}</td>
                  <td className="py-2 pr-4">{entry.waistIn ?? "—"}</td>
                  <td className="py-2 pr-4 text-dim">{entry.device ?? "Manual"}</td>
                  <td className="py-2 pr-4">
                    <form action={deleteBodyMetric.bind(null, entry.id)}>
                      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-dim">
                    No entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
