"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const markerSchema = z.object({
  name: z.string().min(1),
  value: z.coerce.number(),
  unit: z.string().optional(),
  refLow: z.coerce.number().optional(),
  refHigh: z.coerce.number().optional(),
});

export async function createBloodworkPanel(formData: FormData) {
  const userId = await requireUserId();

  const date = z.coerce.date().parse(formData.get("date"));
  const labName = (formData.get("labName") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  const names = formData.getAll("markerName[]") as string[];
  const values = formData.getAll("markerValue[]") as string[];
  const units = formData.getAll("markerUnit[]") as string[];
  const refLows = formData.getAll("markerRefLow[]") as string[];
  const refHighs = formData.getAll("markerRefHigh[]") as string[];

  const markers = names
    .map((name, i) => ({
      name,
      value: values[i],
      unit: units[i],
      refLow: refLows[i],
      refHigh: refHighs[i],
    }))
    .filter((m) => m.name.trim() !== "" && m.value?.trim() !== "")
    .map((m) =>
      markerSchema.parse({
        name: m.name,
        value: m.value,
        unit: m.unit || undefined,
        refLow: m.refLow || undefined,
        refHigh: m.refHigh || undefined,
      })
    );

  if (markers.length === 0) {
    throw new Error("At least one marker is required");
  }

  await prisma.bloodworkPanel.create({
    data: {
      userId,
      date,
      labName,
      notes,
      markers: { create: markers },
    },
  });

  revalidatePath("/");
  redirect("/log/bloodwork?saved=1");
}
