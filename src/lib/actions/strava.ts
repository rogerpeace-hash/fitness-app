"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { syncStravaActivities } from "@/lib/strava";

export async function syncStrava() {
  const userId = await requireUserId();

  let imported = 0;
  try {
    ({ imported } = await syncStravaActivities(userId));
  } catch {
    redirect("/log/workout?strava_error=sync_failed");
  }

  revalidatePath("/log/workout");
  revalidatePath("/");
  redirect(`/log/workout?strava_synced=${imported}`);
}

export async function disconnectStrava() {
  const userId = await requireUserId();
  await prisma.stravaConnection.deleteMany({ where: { userId } });
  revalidatePath("/log/workout");
}
