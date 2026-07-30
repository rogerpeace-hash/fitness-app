import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import DeviceSwitcher from "./DeviceSwitcher";
import InBodySection from "./InBodySection";
import RenphoSection from "./RenphoSection";

export default async function BodyCompositionPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; imported?: string; device?: string }>;
}) {
  const userId = await requireUserId();
  const { saved, imported, device } = await searchParams;

  const [scans, readings] = await Promise.all([
    prisma.inBodyScan.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.bodyMetric.findMany({
      where: { userId, device: "Renpho" },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const initialDevice = device === "Renpho" ? "Renpho" : "InBody";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Body Composition</h1>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Saved.
        </p>
      )}

      <DeviceSwitcher
        initialDevice={initialDevice}
        inbody={<InBodySection scans={scans} imported={device === "InBody" ? imported : undefined} />}
        renpho={<RenphoSection readings={readings} imported={device === "Renpho" ? imported : undefined} />}
      />
    </div>
  );
}
