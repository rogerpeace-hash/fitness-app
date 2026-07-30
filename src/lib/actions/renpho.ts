"use server";

import { z } from "zod";
import Papa from "papaparse";
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
  bmi: optionalNumber,
  skeletalMusclePct: optionalNumber,
  visceralFatLevel: optionalNumber,
  bodyWaterPct: optionalNumber,
  muscleMassLb: optionalNumber,
  boneMassLb: optionalNumber,
  bmr: optionalNumber,
  metabolicAge: optionalNumber,
});

export async function createRenphoReading(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    weightLb: formData.get("weightLb"),
    bodyFatPct: formData.get("bodyFatPct") ?? "",
    bmi: formData.get("bmi") ?? "",
    skeletalMusclePct: formData.get("skeletalMusclePct") ?? "",
    visceralFatLevel: formData.get("visceralFatLevel") ?? "",
    bodyWaterPct: formData.get("bodyWaterPct") ?? "",
    muscleMassLb: formData.get("muscleMassLb") ?? "",
    boneMassLb: formData.get("boneMassLb") ?? "",
    bmr: formData.get("bmr") ?? "",
    metabolicAge: formData.get("metabolicAge") ?? "",
  });

  await prisma.bodyMetric.create({
    data: {
      userId,
      date: parsed.date,
      weightLb: parsed.weightLb,
      bodyFatPct: parsed.bodyFatPct,
      bmi: parsed.bmi,
      skeletalMusclePct: parsed.skeletalMusclePct,
      visceralFatLevel: parsed.visceralFatLevel,
      bodyWaterPct: parsed.bodyWaterPct,
      muscleMassLb: parsed.muscleMassLb,
      boneMassLb: parsed.boneMassLb,
      bmr: parsed.bmr ? Math.round(parsed.bmr) : undefined,
      metabolicAge: parsed.metabolicAge ? Math.round(parsed.metabolicAge) : undefined,
      device: "Renpho",
    },
  });

  revalidatePath("/");
  redirect("/log/body-composition?device=Renpho&saved=1");
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickRaw(row: Record<string, string>, header: string): string | undefined {
  const target = normalizeKey(header);
  for (const [k, v] of Object.entries(row)) {
    if (normalizeKey(k) === target) return v;
  }
  return undefined;
}

function num(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const s = v.trim();
  if (s === "" || s === "-" || s === "--") return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function parseRenphoDateTime(dateStr: string | undefined, timeStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const dm = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!dm) return undefined;
  const [, moStr, daStr, yrStr] = dm;
  let year = parseInt(yrStr, 10);
  if (yrStr.length === 2) year += year < 70 ? 2000 : 1900;
  const month = parseInt(moStr, 10) - 1;
  const day = parseInt(daStr, 10);

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (timeStr) {
    const tm = timeStr.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?$/i);
    if (tm) {
      hours = parseInt(tm[1], 10);
      minutes = parseInt(tm[2], 10);
      seconds = parseInt(tm[3], 10);
      const ampm = tm[4]?.toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }
  }
  return new Date(year, month, day, hours, minutes, seconds);
}

export async function importRenphoCsv(formData: FormData) {
  const userId = await requireUserId();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("No file uploaded");
  }

  const text = await file.text();
  const { data: rows } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const records = [];
  for (const row of rows) {
    const date = parseRenphoDateTime(pickRaw(row, "Date"), pickRaw(row, "Time"));
    const weightLb = num(pickRaw(row, "Weight(lb)"));
    if (!date || weightLb === undefined) continue;

    const bmrRaw = num(pickRaw(row, "BMR(kcal)"));
    const ageRaw = num(pickRaw(row, "Metabolic Age"));

    records.push({
      userId,
      date,
      weightLb,
      bodyFatPct: num(pickRaw(row, "Body Fat(%)")),
      bmi: num(pickRaw(row, "BMI")),
      skeletalMusclePct: num(pickRaw(row, "Skeletal Muscle(%)")),
      fatFreeMassLb: num(pickRaw(row, "Fat-Free Mass(lb)")),
      subcutaneousFatPct: num(pickRaw(row, "Subcutaneous Fat(%)")),
      visceralFatLevel: num(pickRaw(row, "Visceral Fat")),
      bodyWaterPct: num(pickRaw(row, "Body Water(%)")),
      muscleMassLb: num(pickRaw(row, "Muscle Mass(lb)")),
      boneMassLb: num(pickRaw(row, "Bone Mass(lb)")),
      proteinPct: num(pickRaw(row, "Protein (%)")),
      bmr: bmrRaw !== undefined ? Math.round(bmrRaw) : undefined,
      metabolicAge: ageRaw !== undefined ? Math.round(ageRaw) : undefined,
      device: "Renpho",
      source: "IMPORT" as const,
    });
  }

  if (records.length === 0) {
    throw new Error("No valid rows found in file");
  }

  await prisma.bodyMetric.createMany({ data: records });

  revalidatePath("/");
  redirect(`/log/body-composition?device=Renpho&imported=${records.length}`);
}
