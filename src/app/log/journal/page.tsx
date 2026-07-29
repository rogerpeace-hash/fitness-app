import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { saveJournalEntry } from "@/lib/actions/journal";

const moodLabels: Record<number, string> = {
  1: "Rough",
  2: "Tough",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Journal</h1>
      <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
        A quick daily note on how you felt and what you pushed through. One entry per
        day — saving again for the same date updates it.
      </p>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <form action={saveJournalEntry} className="flex flex-col gap-4 max-w-xl">
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

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">How did today go?</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex-1">
                <input type="radio" name="moodRating" value={n} className="peer sr-only" />
                <div className="cursor-pointer rounded-md border border-slate-300 py-2 text-center peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white dark:border-slate-700 dark:peer-checked:border-blue-500 dark:peer-checked:bg-blue-500 dark:peer-checked:text-white">
                  <div className="font-medium">{n}</div>
                  <div className="text-xs">{moodLabels[n]}</div>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          Notes — how you felt, what you pushed through (optional)
          <textarea
            name="entry"
            rows={4}
            className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <button
          type="submit"
          className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          Save entry
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent entries</h2>
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{e.date.toISOString().slice(0, 10)}</span>
                {e.moodRating && (
                  <span className="text-slate-500">
                    {e.moodRating}/5 · {moodLabels[e.moodRating]}
                  </span>
                )}
              </div>
              {e.entry && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{e.entry}</p>}
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-slate-500">No entries yet.</p>}
        </div>
      </div>
    </div>
  );
}
