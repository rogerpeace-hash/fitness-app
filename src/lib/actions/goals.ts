"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const schema = z.object({
  type: z.enum(["WEIGHT", "BODY_FAT", "EXERCISE"]),
  startValue: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  targetValue: z.coerce.number(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const type = formData.get("type");
  // Exercise goals are a weekly frequency target, not a before/after value,
  // so the form omits start value/date for them — default instead.
  const isExercise = type === "EXERCISE";
  const parsed = schema.parse({
    type,
    startValue: isExercise ? formData.get("startValue") || 0 : formData.get("startValue"),
    startDate: isExercise ? formData.get("startDate") || new Date() : formData.get("startDate"),
    targetValue: formData.get("targetValue"),
    targetDate: formData.get("targetDate") || undefined,
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.goal.create({
    data: {
      userId,
      type: parsed.type,
      startValue: parsed.startValue ?? 0,
      startDate: parsed.startDate ?? new Date(),
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
