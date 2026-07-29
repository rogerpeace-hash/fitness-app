"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

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
});

export async function createWorkout(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    type: formData.get("type"),
    durationMin: formData.get("durationMin"),
    caloriesBurned: formData.get("caloriesBurned") ?? "",
    distanceKm: formData.get("distanceKm") ?? "",
  });

  await prisma.workout.create({
    data: {
      userId,
      date: parsed.date,
      type: parsed.type,
      durationMin: parsed.durationMin,
      caloriesBurned: parsed.caloriesBurned,
      distanceKm: parsed.distanceKm,
    },
  });

  revalidatePath("/");
  redirect("/log/workout?saved=1");
}
