import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createBodyMetric } from "@/lib/actions/body-metric";

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
      <h1 className="text-2xl font-semibold">Weight &amp; Body Fat</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <form action={createBodyMetric} className="flex flex-col gap-4 max-w-md">
        <label className="flex flex-col gap-1 text-sm">
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
          Weight (kg)
          <input
            type="number"
            step="0.1"
            name="weightKg"
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
          Notes (optional)
          <textarea
            name="notes"
            rows={2}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Save entry
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent entries</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Weight (kg)</th>
              <th className="py-2 pr-4">Body fat %</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4">{entry.date.toISOString().slice(0, 10)}</td>
                <td className="py-2 pr-4">{entry.weightKg}</td>
                <td className="py-2 pr-4">{entry.bodyFatPct ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-zinc-500">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
