"use server";

import Papa from "papaparse";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { IMPORT_FIELD_DEFS, type ImportDataType } from "@/lib/import/field-defs";

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function toDate(v: unknown): Date | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (s === "") return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function commitImport(formData: FormData) {
  const userId = await requireUserId();

  const dataType = formData.get("dataType") as ImportDataType;
  const file = formData.get("file") as File | null;
  const presetName = (formData.get("presetName") as string | null)?.trim();

  if (!file || file.size === 0) {
    throw new Error("No file uploaded");
  }

  const fieldDefs = IMPORT_FIELD_DEFS[dataType];
  if (!fieldDefs) {
    throw new Error("Unknown data type");
  }

  const mapping: Record<string, string> = {};
  for (const field of fieldDefs) {
    const column = formData.get(`map_${field.key}`) as string | null;
    if (column) mapping[field.key] = column;
    if (field.required && !column) {
      throw new Error(`Missing required column mapping for ${field.label}`);
    }
  }

  const text = await file.text();
  const { data: rows } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  let imported = 0;
  let skipped = 0;

  if (dataType === "BODY_METRIC") {
    const records = [];
    for (const row of rows) {
      const date = toDate(row[mapping.date]);
      const weightKg = toNumber(row[mapping.weightKg]);
      if (!date || weightKg === undefined) {
        skipped++;
        continue;
      }
      records.push({
        userId,
        date,
        weightKg,
        bodyFatPct: mapping.bodyFatPct ? toNumber(row[mapping.bodyFatPct]) : undefined,
        source: "IMPORT" as const,
        sourceLabel: file.name,
      });
    }
    if (records.length) await prisma.bodyMetric.createMany({ data: records });
    imported = records.length;
  } else if (dataType === "NUTRITION_LOG") {
    const records = [];
    for (const row of rows) {
      const date = toDate(row[mapping.date]);
      const calories = toNumber(row[mapping.calories]);
      if (!date || calories === undefined) {
        skipped++;
        continue;
      }
      records.push({
        userId,
        date,
        calories,
        proteinG: mapping.proteinG ? toNumber(row[mapping.proteinG]) : undefined,
        carbsG: mapping.carbsG ? toNumber(row[mapping.carbsG]) : undefined,
        fatG: mapping.fatG ? toNumber(row[mapping.fatG]) : undefined,
        sodiumMg: mapping.sodiumMg ? toNumber(row[mapping.sodiumMg]) : undefined,
        sugarG: mapping.sugarG ? toNumber(row[mapping.sugarG]) : undefined,
        source: "IMPORT" as const,
      });
    }
    if (records.length) await prisma.nutritionLog.createMany({ data: records });
    imported = records.length;
  } else if (dataType === "WORKOUT") {
    const records = [];
    for (const row of rows) {
      const date = toDate(row[mapping.date]);
      const type = mapping.type ? row[mapping.type]?.trim() : undefined;
      const durationMin = toNumber(row[mapping.durationMin]);
      if (!date || !type || durationMin === undefined) {
        skipped++;
        continue;
      }
      records.push({
        userId,
        date,
        type,
        durationMin,
        caloriesBurned: mapping.caloriesBurned ? toNumber(row[mapping.caloriesBurned]) : undefined,
        distanceKm: mapping.distanceKm ? toNumber(row[mapping.distanceKm]) : undefined,
        source: "IMPORT" as const,
      });
    }
    if (records.length) await prisma.workout.createMany({ data: records });
    imported = records.length;
  } else if (dataType === "DAILY_ACTIVITY") {
    for (const row of rows) {
      const date = toDate(row[mapping.date]);
      if (!date) {
        skipped++;
        continue;
      }
      const steps = mapping.steps ? toNumber(row[mapping.steps]) : undefined;
      const activeCalories = mapping.activeCalories ? toNumber(row[mapping.activeCalories]) : undefined;
      const exerciseMinutes = mapping.exerciseMinutes ? toNumber(row[mapping.exerciseMinutes]) : undefined;

      await prisma.dailyActivity.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, steps: steps ? Math.round(steps) : undefined, activeCalories, exerciseMinutes },
        update: { steps: steps ? Math.round(steps) : undefined, activeCalories, exerciseMinutes },
      });
      imported++;
    }
  }

  if (presetName) {
    await prisma.importPreset.upsert({
      where: { userId_name: { userId, name: presetName } },
      create: { userId, name: presetName, dataType, columnMapping: mapping },
      update: { dataType, columnMapping: mapping },
    });
  }

  revalidatePath("/");
  redirect(`/import?imported=${imported}&skipped=${skipped}`);
}
