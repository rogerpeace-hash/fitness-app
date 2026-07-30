"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const schema = z.object({
  type: z.enum(["WEIGHT", "BODY_FAT", "EXERCISE", "EXERCISE_REPS"]),
  exerciseName: z.string().optional(),
  startValue: z.coerce.number().optional(),
  startDate: z.coerce.date().optional(),
  targetValue: z.coerce.number(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export async function createGoal(formData: FormData) {
  const userId = await requireUserId();
  const type = formData.get("type");
  // Exercise frequency goals are a weekly target, not a before/after value,
  // so the form omits start value/date for them — default instead.
  const isFrequencyGoal = type === "EXERCISE";
  const parsed = schema.parse({
    type,
    exerciseName: formData.get("exerciseName") ?? undefined,
    startValue: isFrequencyGoal ? formData.get("startValue") || 0 : formData.get("startValue"),
    startDate: isFrequencyGoal ? formData.get("startDate") || new Date() : formData.get("startDate"),
    targetValue: formData.get("targetValue"),
    targetDate: formData.get("targetDate") || undefined,
    notes: formData.get("notes") ?? undefined,
  });

  if (parsed.type === "EXERCISE_REPS" && !parsed.exerciseName) {
    throw new Error("Exercise name is required");
  }

  await prisma.goal.create({
    data: {
      userId,
      type: parsed.type,
      exerciseName: parsed.type === "EXERCISE_REPS" ? parsed.exerciseName : undefined,
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

const progressSchema = z.object({
  goalId: z.string(),
  date: z.coerce.date(),
  value: z.coerce.number().nonnegative(),
});

export async function logGoalProgress(formData: FormData) {
  const userId = await requireUserId();
  const parsed = progressSchema.parse({
    goalId: formData.get("goalId"),
    date: formData.get("date"),
    value: formData.get("value"),
  });

  const goal = await prisma.goal.findFirst({ where: { id: parsed.goalId, userId } });
  if (!goal) throw new Error("Goal not found");

  await prisma.goalProgressLog.create({
    data: { goalId: parsed.goalId, date: parsed.date, value: parsed.value },
  });

  revalidatePath("/goals");
  revalidatePath("/");
}
