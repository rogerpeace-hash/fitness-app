"use client";

import { useState } from "react";
import Papa from "papaparse";
import { commitImport } from "@/lib/actions/import";
import {
  IMPORT_FIELD_DEFS,
  IMPORT_DATA_TYPE_LABELS,
  type ImportDataType,
} from "@/lib/import/field-defs";

type Preset = {
  id: string;
  name: string;
  dataType: string;
  columnMapping: Record<string, string>;
};

export default function ImportForm({ presets }: { presets: Preset[] }) {
  const [dataType, setDataType] = useState<ImportDataType>("BODY_METRIC");
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [presetName, setPresetName] = useState("");

  const fieldDefs = IMPORT_FIELD_DEFS[dataType];
  const matchingPresets = presets.filter((p) => p.dataType === dataType);

  function handleFile(file: File | undefined) {
    if (!file) {
      setHeaders(null);
      return;
    }
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        setHeaders(results.meta.fields ?? []);
      },
    });
  }

  function applyPreset(preset: Preset) {
    setMapping(preset.columnMapping);
    setPresetName(preset.name);
  }

  return (
    <form action={commitImport} className="flex flex-col gap-6 max-w-2xl">
      <label className="flex flex-col gap-1 text-sm">
        Data type
        <select
          name="dataType"
          value={dataType}
          onChange={(e) => {
            setDataType(e.target.value as ImportDataType);
            setMapping({});
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {Object.entries(IMPORT_DATA_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        CSV file
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {matchingPresets.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          Load saved mapping
          <select
            defaultValue=""
            onChange={(e) => {
              const preset = matchingPresets.find((p) => p.id === e.target.value);
              if (preset) applyPreset(preset);
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">-- none --</option>
            {matchingPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {headers && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Map columns</h3>
          {fieldDefs.map((field) => (
            <label key={field.key} className="flex items-center justify-between gap-4 text-sm">
              <span>
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </span>
              <select
                name={`map_${field.key}`}
                required={field.required}
                value={mapping[field.key] ?? ""}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                }
                className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">-- none --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Save this mapping as a preset (optional)
        <input
          type="text"
          name="presetName"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="e.g. MyFitnessPal Nutrition Export"
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="submit"
        disabled={!headers}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-40"
      >
        Import
      </button>
    </form>
  );
}
