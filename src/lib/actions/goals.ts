"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const schema = z.object({
  type: z.enum(["WEIGHT", "BODY_FAT", "EXERCISE"]),
  startValue: z.coerce.number(),
  startDate: z.coerce.date(),
  targetValue: z.coerce.number(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    type: formData.get("type"),
    startValue: formData.get("startValue"),
    startDate: formData.get("startDate"),
    targetValue: formData.get("targetValue"),
    targetDate: formData.get("targetDate") || undefined,
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.goal.create({
    data: {
      userId,
      type: parsed.type,
      startValue: parsed.startValue,
      startDate: parsed.startDate,
      targetValue: parsed.targetValue,
      targetDate: parsed.targetDate,
      notes: parsed.notes || undefined,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
  redirect("/goals?saved=1");
}

export async function updateGoalStatus(goalId: string, status: "ACTIVE" | "ACHIEVED" | "ABANDONED") {
  const userId = await requireUserId();
  await prisma.goal.updateMany({
    where: { id: goalId, userId },
    data: { status },
  });
  revalidatePath("/goals");
  revalidatePath("/");
}
