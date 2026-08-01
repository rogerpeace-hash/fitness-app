import { createFluidLog, deleteFluidLog } from "@/lib/actions/fluid";
import type { FluidLog } from "@/generated/prisma/client";

const DRINK_TYPES = ["Water", "Coffee", "Tea", "Soda", "Juice", "Alcohol", "Other"];
const QUICK_AMOUNTS = [8, 12, 16, 20, 32];

export default function FluidSection({
  todaysFluids,
  recentFluids,
}: {
  todaysFluids: FluidLog[];
  recentFluids: FluidLog[];
}) {
  const totalOzToday = todaysFluids.reduce((sum, f) => sum + f.amountOz, 0);
  const byType = todaysFluids.reduce<Record<string, number>>((acc, f) => {
    acc[f.drinkType] = (acc[f.drinkType] ?? 0) + f.amountOz;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-hi">Fluid Intake</h2>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">
            {totalOzToday.toFixed(0)} oz
          </span>
          <span className="text-sm text-dim">today</span>
          {Object.keys(byType).length > 0 && (
            <span className="text-sm text-dim">
              ({Object.entries(byType).map(([type, oz]) => `${type} ${oz.toFixed(0)}`).join(" · ")})
            </span>
          )}
        </div>

        <form action={createFluidLog} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="date" value={new Date().toISOString().slice(0, 10)} />
          <label className="flex flex-col gap-1 text-sm">
            Drink
            <select
              name="drinkType"
              defaultValue="Water"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
            >
              {DRINK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Amount (oz)
            <input
              type="number"
              step="1"
              name="amountOz"
              required
              defaultValue={8}
              className="w-24 rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
          >
            Add
          </button>
        </form>
        <p className="mt-2 text-xs text-dimmer">Quick amounts: {QUICK_AMOUNTS.join(", ")} oz</p>
      </div>

      {recentFluids.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Drink</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {recentFluids.map((f) => (
                <tr key={f.id} className="border-b border-border">
                  <td className="py-2 pr-4">{f.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{f.drinkType}</td>
                  <td className="py-2 pr-4">{f.amountOz} oz</td>
                  <td className="py-2 pr-4">
                    <form action={deleteFluidLog.bind(null, f.id)}>
                      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
