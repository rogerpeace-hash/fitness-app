"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

const schema = z.object({
  date: z.coerce.date(),
  moodRating: z.coerce.number().int().min(1).max(5).optional(),
  entry: z.string().optional(),
});

export async function saveJournalEntry(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    moodRating: formData.get("moodRating") || undefined,
    entry: formData.get("entry") ?? undefined,
  });

  // One entry per day — re-submitting the same date updates it.
  await prisma.journalEntry.upsert({
    where: { userId_date: { userId, date: parsed.date } },
    create: {
      userId,
      date: parsed.date,
      moodRating: parsed.moodRating,
      entry: parsed.entry || undefined,
    },
    update: {
      moodRating: parsed.moodRating,
      entry: parsed.entry || undefined,
    },
  });

  revalidatePath("/log/journal");
  redirect("/log/journal?saved=1");
}
