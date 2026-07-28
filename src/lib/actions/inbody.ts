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
  weightKg: z.coerce.number().positive(),
  skeletalMuscleMassKg: optionalNumber,
  bodyFatMassKg: optionalNumber,
  bodyFatPct: optionalNumber,
  visceralFatLevel: optionalNumber,
  bmr: optionalNumber,
  notes: z.string().optional(),
});

export async function createInBodyScan(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    skeletalMuscleMassKg: formData.get("skeletalMuscleMassKg") ?? "",
    bodyFatMassKg: formData.get("bodyFatMassKg") ?? "",
    bodyFatPct: formData.get("bodyFatPct") ?? "",
    visceralFatLevel: formData.get("visceralFatLevel") ?? "",
    bmr: formData.get("bmr") ?? "",
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.inBodyScan.create({
    data: {
      userId,
      date: parsed.date,
      weightKg: parsed.weightKg,
      skeletalMuscleMassKg: parsed.skeletalMuscleMassKg,
      bodyFatMassKg: parsed.bodyFatMassKg,
      bodyFatPct: parsed.bodyFatPct,
      visceralFatLevel: parsed.visceralFatLevel,
      bmr: parsed.bmr ? Math.round(parsed.bmr) : undefined,
      notes: parsed.notes || undefined,
    },
  });

  revalidatePath("/");
  redirect("/log/inbody?saved=1");
}
