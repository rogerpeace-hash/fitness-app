import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createInBodyScan } from "@/lib/actions/inbody";

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

export default async function InBodyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await requireUserId();
  const { saved } = await searchParams;

  const scans = await prisma.inBodyScan.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">InBody Scan</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <form action={createInBodyScan} className="grid max-w-xl grid-cols-2 gap-4">
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
        {numberField("Weight (kg)", "weightKg", { required: true })}
        {numberField("Skeletal muscle mass (kg)", "skeletalMuscleMassKg")}
        {numberField("Body fat mass (kg)", "bodyFatMassKg")}
        {numberField("Body fat %", "bodyFatPct")}
        {numberField("Visceral fat level", "visceralFatLevel")}
        {numberField("BMR (kcal)", "bmr", { step: "1" })}
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
          Save scan
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent scans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2 pr-4">SMM</th>
                <th className="py-2 pr-4">Fat mass</th>
                <th className="py-2 pr-4">Fat %</th>
                <th className="py-2 pr-4">Visceral</th>
                <th className="py-2 pr-4">BMR</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{scan.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{scan.weightKg}</td>
                  <td className="py-2 pr-4">{scan.skeletalMuscleMassKg ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.bodyFatMassKg ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.bodyFatPct ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.visceralFatLevel ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.bmr ?? "—"}</td>
                </tr>
              ))}
              {scans.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-zinc-500">
                    No scans yet.
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
