import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { createInBodyScan, importInBodyCsv, deleteInBodyScan } from "@/lib/actions/inbody";

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
  searchParams: Promise<{ saved?: string; imported?: string }>;
}) {
  const userId = await requireUserId();
  const { saved, imported } = await searchParams;

  const scans = await prisma.inBodyScan.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 20,
  });

  const hasSegmentalData = scans.some((s) => s.rightArmLeanLb !== null);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">InBody Scan</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}
      {imported && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Imported {imported} scan{imported === "1" ? "" : "s"} from your InBody export.
        </p>
      )}

      <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-2 text-sm font-medium">Import from InBody app export (CSV)</h2>
        <p className="mb-3 text-sm text-zinc-500">
          In the InBody app, export your history as CSV and upload it here — this captures
          the full segmental lean/fat breakdown automatically, no manual typing needed.
        </p>
        <form action={importInBodyCsv} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Import
          </button>
        </form>
      </div>

      <details className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium">Or enter a scan manually</summary>
        <form action={createInBodyScan} className="mt-4 grid grid-cols-2 gap-4">
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
          {numberField("Skeletal muscle mass (lb)", "skeletalMuscleMassLb")}
          {numberField("Body fat mass (lb)", "bodyFatMassLb")}
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
      </details>

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
                <th className="py-2 pr-4">Score</th>
                {hasSegmentalData && <th className="py-2 pr-4">Segmental</th>}
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">{scan.date.toISOString().slice(0, 10)}</td>
                  <td className="py-2 pr-4">{scan.weightLb.toFixed(1)}</td>
                  <td className="py-2 pr-4">{scan.skeletalMuscleMassLb ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.bodyFatMassLb ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.bodyFatPct ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.visceralFatLevel ?? "—"}</td>
                  <td className="py-2 pr-4">{scan.inBodyScore ?? "—"}</td>
                  {hasSegmentalData && (
                    <td className="py-2 pr-4 text-zinc-500">
                      {scan.rightArmLeanLb !== null
                        ? `RA ${scan.rightArmLeanLb} · LA ${scan.leftArmLeanLb} · Tr ${scan.trunkLeanLb} · RL ${scan.rightLegLeanLb} · LL ${scan.leftLegLeanLb}`
                        : "—"}
                    </td>
                  )}
                  <td className="py-2 pr-4">
                    <form action={deleteInBodyScan.bind(null, scan.id)}>
                      <button type="submit" className="text-xs text-red-600 underline dark:text-red-400">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {scans.length === 0 && (
                <tr>
                  <td colSpan={hasSegmentalData ? 9 : 8} className="py-4 text-zinc-500">
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
