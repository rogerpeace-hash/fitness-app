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
  skeletalMuscleMassLb: optionalNumber,
  bodyFatMassLb: optionalNumber,
  bodyFatPct: optionalNumber,
  visceralFatLevel: optionalNumber,
  bmr: optionalNumber,
  notes: z.string().optional(),
});

export async function createInBodyScan(formData: FormData) {
  const userId = await requireUserId();
  const parsed = schema.parse({
    date: formData.get("date"),
    weightLb: formData.get("weightLb"),
    skeletalMuscleMassLb: formData.get("skeletalMuscleMassLb") ?? "",
    bodyFatMassLb: formData.get("bodyFatMassLb") ?? "",
    bodyFatPct: formData.get("bodyFatPct") ?? "",
    visceralFatLevel: formData.get("visceralFatLevel") ?? "",
    bmr: formData.get("bmr") ?? "",
    notes: formData.get("notes") ?? undefined,
  });

  await prisma.inBodyScan.create({
    data: {
      userId,
      date: parsed.date,
      weightLb: parsed.weightLb,
      skeletalMuscleMassLb: parsed.skeletalMuscleMassLb,
      bodyFatMassLb: parsed.bodyFatMassLb,
      bodyFatPct: parsed.bodyFatPct,
      visceralFatLevel: parsed.visceralFatLevel,
      bmr: parsed.bmr ? Math.round(parsed.bmr) : undefined,
      notes: parsed.notes || undefined,
    },
  });

  revalidatePath("/");
  redirect("/log/inbody?saved=1");
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
  if (s === "" || s === "-") return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
}

function parseInBodyDate(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  const s = v.trim();
  // InBody app export format: YYYYMMDDHHMMSS
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se));
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function importInBodyCsv(formData: FormData) {
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
    const date = parseInBodyDate(pickRaw(row, "date"));
    const weightLb = num(pickRaw(row, "Weight(lb)"));
    if (!date || weightLb === undefined) continue;

    const bmrRaw = num(pickRaw(row, "Basal Metabolic Rate(kcal)"));
    const scoreRaw = num(pickRaw(row, "InBody Score"));

    records.push({
      userId,
      date,
      weightLb,
      skeletalMuscleMassLb: num(pickRaw(row, "Skeletal Muscle Mass(lb)")),
      bodyFatMassLb: num(pickRaw(row, "Body Fat Mass(lb)")),
      bodyFatPct: num(pickRaw(row, "Percent Body Fat(%)")),
      bmr: bmrRaw !== undefined ? Math.round(bmrRaw) : undefined,
      inBodyScore: scoreRaw !== undefined ? Math.round(scoreRaw) : undefined,
      rightArmLeanLb: num(pickRaw(row, "Right Arm Lean Mass(lb)")),
      leftArmLeanLb: num(pickRaw(row, "Left Arm Lean Mass(lb)")),
      trunkLeanLb: num(pickRaw(row, "Trunk Lean Mass(lb)")),
      rightLegLeanLb: num(pickRaw(row, "Right Leg Lean Mass(lb)")),
      leftLegLeanLb: num(pickRaw(row, "Left Leg Lean Mass(lb)")),
      rightArmFatLb: num(pickRaw(row, "Right Arm Fat Mass(lb)")),
      leftArmFatLb: num(pickRaw(row, "Left Arm Fat Mass(lb)")),
      trunkFatLb: num(pickRaw(row, "Trunk Fat Mass(lb)")),
      rightLegFatLb: num(pickRaw(row, "Right Leg Fat Mass(lb)")),
      leftLegFatLb: num(pickRaw(row, "Left Leg Fat Mass(lb)")),
      visceralFatLevel: num(pickRaw(row, "Visceral Fat Level(Level)")),
      totalBodyWaterL: num(pickRaw(row, "Total Body Water(L)")),
      intracellularWaterL: num(pickRaw(row, "Intracellular Water(L)")),
      extracellularWaterL: num(pickRaw(row, "Extracellular Water(L)")),
      ecwRatio: num(pickRaw(row, "ECW Ratio")),
      bodyCellMassLb: num(pickRaw(row, "Body Cell Mass(lb)")),
      smi: num(pickRaw(row, "SMI(kg/m²)")),
      phaseAngle: num(pickRaw(row, "Whole Body Phase Angle(°)")),
    });
  }

  if (records.length === 0) {
    throw new Error("No valid rows found in file");
  }

  await prisma.inBodyScan.createMany({ data: records });

  revalidatePath("/");
  redirect(`/log/inbody?imported=${records.length}`);
}
