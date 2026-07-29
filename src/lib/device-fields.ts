export type DeviceMetricField = {
  key: string;
  label: string;
  step?: string;
};

// Extra metrics per device, beyond the core duration/calories/distance fields
// already on Workout. Stored in Workout.metrics as JSON keyed by `key`.
export const DEVICE_METRIC_FIELDS: Record<string, DeviceMetricField[]> = {
  MyZone: [
    { key: "meps", label: "MEPs", step: "0.1" },
    { key: "effort", label: "Effort (%)", step: "1" },
    { key: "avgHeartRate", label: "Avg heart rate (bpm)", step: "1" },
  ],
  "Oura Ring": [
    { key: "avgHeartRate", label: "Avg heart rate (bpm)", step: "1" },
    { key: "activityScore", label: "Activity score", step: "1" },
  ],
  Garmin: [
    { key: "avgHeartRate", label: "Avg heart rate (bpm)", step: "1" },
    { key: "trainingEffect", label: "Training effect", step: "0.1" },
  ],
  Strava: [
    { key: "avgHeartRate", label: "Avg heart rate (bpm)", step: "1" },
    { key: "avgPaceMinKm", label: "Avg pace (min/km)", step: "0.1" },
    { key: "elevationGainM", label: "Elevation gain (m)", step: "1" },
  ],
  Runna: [
    { key: "avgPaceMinKm", label: "Avg pace (min/km)", step: "0.1" },
    { key: "avgHeartRate", label: "Avg heart rate (bpm)", step: "1" },
  ],
  "Apple Health": [{ key: "avgHeartRate", label: "Avg heart rate (bpm)", step: "1" }],
};

export const DEVICE_OPTIONS = ["", ...Object.keys(DEVICE_METRIC_FIELDS), "Other"];
