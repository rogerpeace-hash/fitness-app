"use client";

import { useRef, useState } from "react";
import { createNutritionLog, analyzeFoodPhoto, type FoodPhotoAnalysis } from "@/lib/actions/nutrition";

export default function NutritionForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    description: "",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyAnalysis(a: FoodPhotoAnalysis) {
    setValues({
      description: a.description,
      calories: String(Math.round(a.calories)),
      proteinG: String(Math.round(a.proteinG)),
      carbsG: String(Math.round(a.carbsG)),
      fatG: String(Math.round(a.fatG)),
    });
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const result = await analyzeFoodPhoto(fd);
      if (result.ok) {
        applyAnalysis(result.analysis);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong analyzing the photo.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <form action={createNutritionLog} className="flex flex-col gap-4 max-w-xl">
      <div className="flex flex-col gap-2 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
        <label className="text-sm font-medium">Snap a meal (optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          className="text-sm"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Meal preview" className="mt-2 max-h-48 rounded-md object-cover" />
        )}
        {analyzing && <p className="text-sm text-zinc-500">Analyzing photo…</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {values.description && !analyzing && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Identified: {values.description} — review the estimated numbers below before saving.
          </p>
        )}
      </div>

      <input type="hidden" name="notes" value={values.description} />

      <label className="flex flex-col gap-1 text-sm">
        Date
        <input
          type="date"
          name="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Calories
          <input
            type="number"
            step="1"
            name="calories"
            required
            value={values.calories}
            onChange={(e) => setValues((v) => ({ ...v, calories: e.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Protein (g)
          <input
            type="number"
            step="1"
            name="proteinG"
            value={values.proteinG}
            onChange={(e) => setValues((v) => ({ ...v, proteinG: e.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Carbs (g)
          <input
            type="number"
            step="1"
            name="carbsG"
            value={values.carbsG}
            onChange={(e) => setValues((v) => ({ ...v, carbsG: e.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fat (g)
          <input
            type="number"
            step="1"
            name="fatG"
            value={values.fatG}
            onChange={(e) => setValues((v) => ({ ...v, fatG: e.target.value }))}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sodium (mg, optional)
          <input
            type="number"
            step="1"
            name="sodiumMg"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sugar (g, optional)
          <input
            type="number"
            step="1"
            name="sugarG"
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <button
        type="submit"
        className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        Save entry
      </button>
    </form>
  );
}
