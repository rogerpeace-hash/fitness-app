"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { DEVICE_METRIC_FIELDS } from "@/lib/device-fields";

const optionalNumber = z
  .union([z.coerce.number(), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

const schema = z.object({
  date: z.coerce.date(),
  type: z.string().min(1),
  durationMin: z.coerce.number().positive(),
  caloriesBurned: optionalNumber,
  distanceKm: optionalNumber,
  trackedWith: z.string().optional(),
});

export async function createWorkout(formData: FormData) {
  const userId = await requireUserId();
  const trackedWith = (formData.get("trackedWith") as string) || undefined;
  const parsed = schema.parse({
    date: formData.get("date"),
    type: formData.get("type"),
    durationMin: formData.get("durationMin"),
    caloriesBurned: formData.get("caloriesBurned") ?? "",
    distanceKm: formData.get("distanceKm") ?? "",
    trackedWith,
  });

  const fieldDefs = trackedWith ? DEVICE_METRIC_FIELDS[trackedWith] : undefined;
  let metrics: Record<string, number> | undefined;
  if (fieldDefs) {
    for (const field of fieldDefs) {
      const raw = formData.get(`metric_${field.key}`);
      if (raw !== null && raw !== "") {
        const n = Number(raw);
        if (!Number.isNaN(n)) {
          metrics = metrics ?? {};
          metrics[field.key] = n;
        }
      }
    }
  }

  await prisma.workout.create({
    data: {
      userId,
      date: parsed.date,
      type: parsed.type,
      durationMin: parsed.durationMin,
      caloriesBurned: parsed.caloriesBurned,
      distanceKm: parsed.distanceKm,
      trackedWith: parsed.trackedWith,
      metrics,
    },
  });

  revalidatePath("/");
  redirect("/log/workout?saved=1");
}
