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
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Journal</h1>
      <p className="max-w-xl text-sm text-dim">
        A quick daily note on how you felt and what you pushed through. One entry per
        day — saving again for the same date updates it.
      </p>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
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
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">How did today go?</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex-1">
                <input type="radio" name="moodRating" value={n} className="peer sr-only" />
                <div className="cursor-pointer rounded-lg border border-border py-2 text-center text-hi peer-checked:border-ignite peer-checked:bg-ignite peer-checked:text-ignite-fg">
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
            className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="w-fit rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
        >
          Save entry
        </button>
      </form>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-hi">Recent entries</h2>
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{e.date.toISOString().slice(0, 10)}</span>
                {e.moodRating && (
                  <span className="text-dim">
                    {e.moodRating}/5 · {moodLabels[e.moodRating]}
                  </span>
                )}
              </div>
              {e.entry && <p className="mt-2 text-sm text-dim">{e.entry}</p>}
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-dim">No entries yet.</p>}
        </div>
      </div>
    </div>
  );
}
