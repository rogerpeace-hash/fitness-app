"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const schema = z.object({
  date: z.coerce.date(),
  drinkType: z.string().min(1),
  amountOz: z.coerce.number().positive(),
});

export async function createFluidLog(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    drinkType: formData.get("drinkType"),
    amountOz: formData.get("amountOz"),
  });

  await prisma.fluidLog.create({
    data: {
      userId,
      date: parsed.date,
      drinkType: parsed.drinkType,
      amountOz: parsed.amountOz,
    },
  });

  revalidatePath("/log/nutrition");
}

export async function deleteFluidLog(id: string) {
  const userId = await requireUserId();
  await prisma.fluidLog.deleteMany({ where: { id, userId } });
  revalidatePath("/log/nutrition");
}
