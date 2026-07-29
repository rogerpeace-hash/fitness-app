import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import ImportForm from "./ImportForm";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string }>;
}) {
  const userId = await requireUserId();
  const { imported, skipped } = await searchParams;

  const presets = await prisma.importPreset.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Import data</h1>
      <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        Upload a CSV export (e.g. MyFitnessPal Nutrition export, or a workout/steps
        CSV from an Apple Health export tool), pick what kind of data it contains,
        then map its columns to the fields below. You can save the mapping as a
        preset to reuse next time you export the same way.
      </p>

      {imported !== undefined && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Imported {imported} row{imported === "1" ? "" : "s"}
          {skipped && Number(skipped) > 0 ? ` (skipped ${skipped} invalid row${skipped === "1" ? "" : "s"})` : ""}.
        </p>
      )}

      <ImportForm
        presets={presets.map((p) => ({
          id: p.id,
          name: p.name,
          dataType: p.dataType,
          columnMapping: p.columnMapping as Record<string, string>,
        }))}
      />
    </div>
  );
}
