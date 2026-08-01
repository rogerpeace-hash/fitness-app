import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { deleteNutritionLog } from "@/lib/actions/nutrition";
import NutritionForm from "./NutritionForm";
import FluidSection from "./FluidSection";

export default async function NutritionLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [entries, todaysFluids, recentFluids] = await Promise.all([
    prisma.nutritionLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.fluidLog.findMany({
      where: { userId, date: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.fluidLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Nutrition</h1>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
          Saved.
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-hi">Food</h2>
          <NutritionForm />
        </div>
        <FluidSection todaysFluids={todaysFluids} recentFluids={recentFluids} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-hi">Recent food entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Calories</th>
                <th className="py-2 pr-4">Protein</th>
                <th className="py-2 pr-4">Carbs</th>
                <th className="py-2 pr-4">Fat</th>
                <th className="py-2 pr-4">Notes</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-border">
                  <td className="py-2 pr-4">{e.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{Math.round(e.calories)}</td>
                  <td className="py-2 pr-4">{e.proteinG ?? "—"}</td>
                  <td className="py-2 pr-4">{e.carbsG ?? "—"}</td>
                  <td className="py-2 pr-4">{e.fatG ?? "—"}</td>
                  <td className="py-2 pr-4 max-w-[200px] truncate text-dim">{e.notes ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <form action={deleteNutritionLog.bind(null, e.id)}>
                      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-dim">
                    No nutrition entries yet.
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
