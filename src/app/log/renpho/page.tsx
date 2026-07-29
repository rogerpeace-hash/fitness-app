import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createRenphoReading, importRenphoCsv } from "@/lib/actions/renpho";

const numberField = (
  label: string,
  name: string,
  { required = false, step = "0.1" }: { required?: boolean; step?: string } = {}
) => (
  <label className="flex flex-col gap-1 text-sm">
    {label}
    <input
      type="number"
      step={step}
      name={name}
      required={required}
      className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
    />
  </label>
);

export default async function RenphoLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; imported?: string }>;
}) {
  const userId = await requireUserId();
  const { saved, imported } = await searchParams;

  const readings = await prisma.bodyMetric.findMany({
    where: { userId, device: "Renpho" },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Renpho Scale</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}
      {imported && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Imported {imported} reading{imported === "1" ? "" : "s"} from your Renpho export.
        </p>
      )}

      <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-sm font-medium">Import from Renpho app export (CSV)</h2>
        <p className="mb-3 text-sm text-zinc-500">
          In the Renpho app, export your history as CSV and upload it here.
        </p>
        <form action={importRenphoCsv} className="flex flex-wrap items-center gap-3">
          <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Import
          </button>
        </form>
      </div>

      <details className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium">Or enter a reading manually</summary>
        <form action={createRenphoReading} className="mt-4 grid grid-cols-2 gap-4">
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
          {numberField("Weight (lb)", "weightLb", { required: true })}
          {numberField("BMI", "bmi")}
          {numberField("Body fat %", "bodyFatPct")}
          {numberField("Skeletal muscle %", "skeletalMusclePct")}
          {numberField("Visceral fat level", "visceralFatLevel")}
          {numberField("Body water %", "bodyWaterPct")}
          {numberField("Muscle mass (lb)", "muscleMassLb")}
          {numberField("Bone mass (lb)", "boneMassLb")}
          {numberField("BMR (kcal)", "bmr", { step: "1" })}
          {numberField("Metabolic age", "metabolicAge", { step: "1" })}
          <button
            type="submit"
            className="col-span-2 w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Save reading
          </button>
        </form>
      </details>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent readings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2 pr-4">Body fat %</th>
                <th className="py-2 pr-4">Skeletal muscle %</th>
                <th className="py-2 pr-4">Visceral fat</th>
                <th className="py-2 pr-4">Metabolic age</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{r.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{r.weightLb.toFixed(1)}</td>
                  <td className="py-2 pr-4">{r.bodyFatPct ?? "—"}</td>
                  <td className="py-2 pr-4">{r.skeletalMusclePct ?? "—"}</td>
                  <td className="py-2 pr-4">{r.visceralFatLevel ?? "—"}</td>
                  <td className="py-2 pr-4">{r.metabolicAge ?? "—"}</td>
                </tr>
              ))}
              {readings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-zinc-500">
                    No Renpho readings yet.
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
