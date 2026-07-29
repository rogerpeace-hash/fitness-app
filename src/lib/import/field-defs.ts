export type ImportDataType = "BODY_METRIC" | "NUTRITION_LOG" | "WORKOUT" | "DAILY_ACTIVITY";

export type ImportFieldDef = {
  key: string;
  label: string;
  required: boolean;
};

export const IMPORT_FIELD_DEFS: Record<ImportDataType, ImportFieldDef[]> = {
  BODY_METRIC: [
    { key: "date", label: "Date", required: true },
    { key: "weightLb", label: "Weight (lb)", required: true },
    { key: "bodyFatPct", label: "Body fat %", required: false },
  ],
  NUTRITION_LOG: [
    { key: "date", label: "Date", required: true },
    { key: "calories", label: "Calories", required: true },
    { key: "proteinG", label: "Protein (g)", required: false },
    { key: "carbsG", label: "Carbohydrates (g)", required: false },
    { key: "fatG", label: "Fat (g)", required: false },
    { key: "sodiumMg", label: "Sodium (mg)", required: false },
    { key: "sugarG", label: "Sugar (g)", required: false },
  ],
  WORKOUT: [
    { key: "date", label: "Date", required: true },
    { key: "type", label: "Workout type", required: true },
    { key: "durationMin", label: "Duration (min)", required: true },
    { key: "caloriesBurned", label: "Calories burned", required: false },
    { key: "distanceKm", label: "Distance (km)", required: false },
  ],
  DAILY_ACTIVITY: [
    { key: "date", label: "Date", required: true },
    { key: "steps", label: "Steps", required: false },
    { key: "activeCalories", label: "Active calories", required: false },
    { key: "exerciseMinutes", label: "Exercise minutes", required: false },
  ],
};

export const IMPORT_DATA_TYPE_LABELS: Record<ImportDataType, string> = {
  BODY_METRIC: "Weight / body metric",
  NUTRITION_LOG: "Nutrition log (e.g. MyFitnessPal export)",
  WORKOUT: "Workout (e.g. Apple Health export)",
  DAILY_ACTIVITY: "Daily activity (steps, active calories)",
};
