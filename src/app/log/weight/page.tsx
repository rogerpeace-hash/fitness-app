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
      <h1 className="text-2xl font-semibold">Weight &amp; Measurements</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
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
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Weight (lb)
          <input
            type="number"
            step="0.1"
            name="weightLb"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Body fat % (optional)
          <input
            type="number"
            step="0.1"
            name="bodyFatPct"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Neck (in, optional)
          <input
            type="number"
            step="0.1"
            name="neckIn"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Waist (in, optional)
          <input
            type="number"
            step="0.1"
            name="waistIn"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hip (in, optional)
          <input
            type="number"
            step="0.1"
            name="hipIn"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm">
          Notes (optional)
          <textarea
            name="notes"
            rows={2}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="col-span-2 w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Save entry
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
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
                <tr key={entry.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{entry.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{entry.weightLb.toFixed(1)}</td>
                  <td className="py-2 pr-4">{entry.bodyFatPct ?? "—"}</td>
                  <td className="py-2 pr-4">{entry.waistIn ?? "—"}</td>
                  <td className="py-2 pr-4 text-zinc-500">{entry.device ?? "Manual"}</td>
                  <td className="py-2 pr-4">
                    <form action={deleteBodyMetric.bind(null, entry.id)}>
                      <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-zinc-500">
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
