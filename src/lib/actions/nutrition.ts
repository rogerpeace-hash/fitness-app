"use server";

import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
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
  calories: z.coerce.number().nonnegative(),
  proteinG: optionalNumber,
  carbsG: optionalNumber,
  fatG: optionalNumber,
  sodiumMg: optionalNumber,
  sugarG: optionalNumber,
  notes: z.string().optional(),
});

export async function createNutritionLog(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    calories: formData.get("calories"),
    proteinG: formData.get("proteinG") ?? "",
    carbsG: formData.get("carbsG") ?? "",
    fatG: formData.get("fatG") ?? "",
    sodiumMg: formData.get("sodiumMg") ?? "",
    sugarG: formData.get("sugarG") ?? "",
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.nutritionLog.create({
    data: {
      userId,
      date: parsed.date,
      calories: parsed.calories,
      proteinG: parsed.proteinG,
      carbsG: parsed.carbsG,
      fatG: parsed.fatG,
      sodiumMg: parsed.sodiumMg,
      sugarG: parsed.sugarG,
      notes: parsed.notes || undefined,
    },
  });

  revalidatePath("/");
  revalidatePath("/log/nutrition");
  redirect("/log/nutrition?saved=1");
}

export async function deleteNutritionLog(id: string) {
  const userId = await requireUserId();
  await prisma.nutritionLog.deleteMany({ where: { id, userId } });
  revalidatePath("/");
  revalidatePath("/log/nutrition");
}

const analysisSchema = z.object({
  description: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
});

export type FoodPhotoAnalysis = z.infer<typeof analysisSchema>;

const ANALYZE_PROMPT = `You are estimating nutrition information from a photo of food for a personal health tracking app. Identify the food items visible and estimate a reasonable serving size based on what's shown. These are estimates for daily tracking purposes, not lab-precise measurements - do your best given typical portion sizes.

Respond with ONLY a JSON object (no markdown fences, no other text) matching exactly this shape:
{"description": "short description of the food/meal", "calories": number, "proteinG": number, "carbsG": number, "fatG": number}`;

export async function analyzeFoodPhoto(formData: FormData): Promise<
  { ok: true; analysis: FoodPhotoAnalysis } | { ok: false; error: string }
> {
  await requireUserId();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY not configured" };
  }

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "No image provided" };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "Image is too large (max 8MB)" };
  }

  const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaType = supportedTypes.includes(file.type) ? file.type : "image/jpeg";

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as "image/jpeg", data: base64 },
            },
            { type: "text", text: ANALYZE_PROMPT },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "No response from model" };
    }

    const cleaned = textBlock.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const parsed = analysisSchema.parse(JSON.parse(cleaned));
    return { ok: true, analysis: parsed };
  } catch {
    return { ok: false, error: "Couldn't analyze that photo — try again or enter values manually." };
  }
}
