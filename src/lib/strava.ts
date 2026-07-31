import { prisma } from "@/lib/prisma";
import type { StravaConnection } from "@/generated/prisma/client";
import type { LatLng, RoutePoint } from "@/lib/geo";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

export function decodePolyline(encoded: string): LatLng[] {
  const factor = 1e5;
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({ lat: lat / factor, lng: lng / factor });
  }

  return coordinates;
}

async function refreshAccessToken(connection: StravaConnection): Promise<StravaConnection> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Strava access token");
  const data = await res.json();

  return prisma.stravaConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
    },
  });
}

export async function getValidConnection(userId: string): Promise<StravaConnection | null> {
  const connection = await prisma.stravaConnection.findUnique({ where: { userId } });
  if (!connection) return null;
  // Refresh a little early rather than right at expiry.
  if (connection.expiresAt.getTime() > Date.now() + 60_000) return connection;
  return refreshAccessToken(connection);
}

type StravaActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  total_elevation_gain: number;
  start_date_local: string;
  average_heartrate?: number;
  map?: { summary_polyline?: string };
};

export async function syncStravaActivities(userId: string): Promise<{ imported: number }> {
  const connection = await getValidConnection(userId);
  if (!connection) throw new Error("Strava is not connected");

  const after = connection.lastSyncedAt
    ? Math.floor(connection.lastSyncedAt.getTime() / 1000)
    : Math.floor((Date.now() - 1000 * 60 * 60 * 24 * 365) / 1000);

  const activities: StravaActivity[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?after=${after}&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${connection.accessToken}` } },
    );
    if (!res.ok) throw new Error(`Strava API error: ${res.status}`);
    const batch: StravaActivity[] = await res.json();
    activities.push(...batch);
    if (batch.length < 100) break;
  }

  let imported = 0;
  for (const activity of activities) {
    const distanceKm = activity.distance / 1000;
    const durationMin = activity.moving_time / 60;
    const startMs = new Date(activity.start_date_local).getTime();
    const routePoints: RoutePoint[] | undefined = activity.map?.summary_polyline
      ? decodePolyline(activity.map.summary_polyline).map((p) => ({ ...p, t: startMs }))
      : undefined;

    const metrics: Record<string, number> = {};
    if (activity.average_heartrate) metrics.avgHeartRate = Math.round(activity.average_heartrate);
    if (distanceKm > 0) metrics.avgPaceMinKm = Number((durationMin / distanceKm).toFixed(2));
    if (activity.total_elevation_gain) metrics.elevationGainM = Math.round(activity.total_elevation_gain);

    await prisma.workout.upsert({
      where: { stravaActivityId: String(activity.id) },
      create: {
        userId,
        date: new Date(activity.start_date_local),
        type: activity.sport_type || activity.type || "Workout",
        durationMin,
        distanceKm: distanceKm > 0 ? distanceKm : undefined,
        trackedWith: "Strava",
        metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
        routePoints: routePoints ?? undefined,
        stravaActivityId: String(activity.id),
        source: "IMPORT",
      },
      // Already imported — leave alone in case the user edited it since.
      update: {},
    });
    imported += 1;
  }

  await prisma.stravaConnection.update({
    where: { id: connection.id },
    data: { lastSyncedAt: new Date() },
  });

  return { imported };
}
