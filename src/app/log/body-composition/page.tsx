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
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-hi">Body Composition</h1>

      {saved && (
        <p className="rounded-lg border border-surge/30 bg-surge/10 px-4 py-2 text-sm text-surge">
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
