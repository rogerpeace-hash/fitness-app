import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { deleteNutritionLog } from "@/lib/actions/nutrition";
import NutritionForm from "./NutritionForm";

export default async function NutritionLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const entries = await prisma.nutritionLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Nutrition</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <NutritionForm />

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
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
                <tr key={e.id} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="py-2 pr-4">{e.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{Math.round(e.calories)}</td>
                  <td className="py-2 pr-4">{e.proteinG ?? "—"}</td>
                  <td className="py-2 pr-4">{e.carbsG ?? "—"}</td>
                  <td className="py-2 pr-4">{e.fatG ?? "—"}</td>
                  <td className="py-2 pr-4 max-w-[200px] truncate text-slate-500">{e.notes ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <form action={deleteNutritionLog.bind(null, e.id)}>
                      <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-slate-500">
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
