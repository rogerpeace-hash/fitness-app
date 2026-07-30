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
  weightLb: z.coerce.number().positive(),
  bodyFatPct: optionalNumber,
  neckIn: optionalNumber,
  waistIn: optionalNumber,
  hipIn: optionalNumber,
  notes: z.string().optional(),
});

export async function createBodyMetric(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    weightLb: formData.get("weightLb"),
    bodyFatPct: formData.get("bodyFatPct") ?? "",
    neckIn: formData.get("neckIn") ?? "",
    waistIn: formData.get("waistIn") ?? "",
    hipIn: formData.get("hipIn") ?? "",
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.bodyMetric.create({
    data: {
      userId,
      date: parsed.date,
      weightLb: parsed.weightLb,
      bodyFatPct: parsed.bodyFatPct,
      neckIn: parsed.neckIn,
      waistIn: parsed.waistIn,
      hipIn: parsed.hipIn,
      notes: parsed.notes || undefined,
    },
  });

  revalidatePath("/");
  redirect("/log/weight?saved=1");
}

export async function deleteBodyMetric(id: string) {
  const userId = await requireUserId();
  await prisma.bodyMetric.deleteMany({ where: { id, userId } });
  revalidatePath("/");
  revalidatePath("/log/weight");
  revalidatePath("/log/body-composition");
}
