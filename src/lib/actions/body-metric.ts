"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const schema = z.object({
  date: z.coerce.date(),
  weightKg: z.coerce.number().positive(),
  bodyFatPct: z.coerce.number().min(0).max(100).optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().optional(),
});

export async function createBodyMetric(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    bodyFatPct: formData.get("bodyFatPct") ?? "",
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.bodyMetric.create({
    data: {
      userId,
      date: parsed.date,
      weightKg: parsed.weightKg,
      bodyFatPct: parsed.bodyFatPct,
      notes: parsed.notes || undefined,
    },
  });

  revalidatePath("/");
  redirect("/log/weight?saved=1");
}
