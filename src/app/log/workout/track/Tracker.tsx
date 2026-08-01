"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { saveTrackedWorkout } from "@/lib/actions/workout";
import {
  haversineKm,
  totalDistanceKm,
  formatDuration,
  formatPaceMinKm,
  type LatLng,
  type RoutePoint,
} from "@/lib/geo";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 300 }} className="animate-pulse rounded-lg bg-surface-2" />
  ),
});

const PlannerMap = dynamic(() => import("./PlannerMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280 }} className="animate-pulse rounded-lg bg-surface-2" />
  ),
});

type Status = "idle" | "recording" | "paused" | "finished";
type SearchResult = { label: string; lat: number; lng: number };

// Fixes where accuracy is worse than this are dropped to keep the route (and
// distance total) from being thrown off by a bad GPS fix.
const MAX_ACCURACY_M = 50;
// Points closer than this to the last kept point are dropped — otherwise GPS
// jitter while standing still quietly inflates the distance total.
const MIN_POINT_GAP_KM = 0.003;
const ARRIVED_THRESHOLD_KM = 0.05;

export default function Tracker() {
  const [status, setStatus] = useState<Status>("idle");
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [plannedRoute, setPlannedRoute] = useState<LatLng[] | null>(null);
  const [plannedDistanceKm, setPlannedDistanceKm] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const segmentStartRef = useRef(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  async function planRouteTo(dest: LatLng) {
    setDestination(dest);
    setSearchResults([]);
    if (!origin) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("no route");
      const coords: LatLng[] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ lat, lng }),
      );
      setPlannedRoute(coords);
      setPlannedDistanceKm(data.routes[0].distance / 1000);
    } catch {
      setRouteError("Couldn't fetch walking directions there — you can still record without a planned route.");
      setPlannedRoute(null);
      setPlannedDistanceKm(null);
    } finally {
      setRouteLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      setSearchResults(
        (data as { display_name: string; lat: string; lon: string }[]).map((d) => ({
          label: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        })),
      );
    } catch {
      setRouteError("Search failed — try tapping the map instead.");
    }
  }

  function clearDestination() {
    setDestination(null);
    setPlannedRoute(null);
    setPlannedDistanceKm(null);
    setRouteError(null);
    setSearchResults([]);
  }

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Not critical — recording still works, the screen may just dim/lock.
    }
  }

  function releaseWakeLock() {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }

  function startWatch() {
    if (!("geolocation" in navigator)) {
      setError("This browser doesn't support GPS location.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy && accuracy > MAX_ACCURACY_M) return;
        setError(null);
        setPoints((prev) => {
          const next: RoutePoint = { lat: latitude, lng: longitude, t: pos.timestamp };
          if (prev.length > 0 && haversineKm(prev[prev.length - 1], next) < MIN_POINT_GAP_KM) {
            return prev;
          }
          return [...prev, next];
        });
      },
      (err) => setError(err.message || "Couldn't get your location."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  function stopWatch() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  function startTicker() {
    tickRef.current = window.setInterval(() => {
      setElapsedMs(accumulatedRef.current + (performance.now() - segmentStartRef.current));
    }, 1000);
  }

  function stopTicker() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && status === "recording") {
        requestWakeLock();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status]);

  useEffect(() => {
    return () => {
      stopWatch();
      stopTicker();
      releaseWakeLock();
    };
  }, []);

  async function handleStart() {
    setError(null);
    setPoints([]);
    accumulatedRef.current = 0;
    segmentStartRef.current = performance.now();
    setElapsedMs(0);
    startWatch();
    startTicker();
    await requestWakeLock();
    setStatus("recording");
  }

  function handlePause() {
    stopWatch();
    stopTicker();
    accumulatedRef.current += performance.now() - segmentStartRef.current;
    setElapsedMs(accumulatedRef.current);
    releaseWakeLock();
    setStatus("paused");
  }

  async function handleResume() {
    segmentStartRef.current = performance.now();
    startWatch();
    startTicker();
    await requestWakeLock();
    setStatus("recording");
  }

  function handleFinish() {
    stopWatch();
    stopTicker();
    if (status === "recording") {
      accumulatedRef.current += performance.now() - segmentStartRef.current;
      setElapsedMs(accumulatedRef.current);
    }
    releaseWakeLock();
    setStatus("finished");
  }

  function handleDiscard() {
    setPoints([]);
    setElapsedMs(0);
    accumulatedRef.current = 0;
    setStatus("idle");
  }

  const distanceKm = totalDistanceKm(points);
  const durationMin = elapsedMs / 60000;
  const currentPosition = points.length > 0 ? points[points.length - 1] : origin;
  const remainingKm = destination && currentPosition ? haversineKm(currentPosition, destination) : null;
  const arrived = remainingKm !== null && remainingKm <= ARRIVED_THRESHOLD_KM;

  if (status === "idle") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-dim">
          Uses your phone&apos;s GPS to draw the route and calculate distance and pace. Keep this
          page open and your screen on while recording — the browser stops tracking if you switch
          apps or lock your phone. Music from Spotify or Apple Music keeps playing fine in the
          background while you record.
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Plan a route (optional)</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a destination…"
              className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-hi focus:border-ignite focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-semibold text-hi hover:bg-border"
            >
              Search
            </button>
          </form>
          {searchResults.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-lg border border-border">
              {searchResults.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => planRouteTo({ lat: r.lat, lng: r.lng })}
                    className="w-full truncate px-3 py-2 text-left text-sm text-hi hover:bg-surface-2"
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-dimmer">…or tap the map to drop a pin.</p>

          {origin ? (
            <PlannerMap
              origin={origin}
              destination={destination}
              routeCoords={plannedRoute}
              onPick={planRouteTo}
            />
          ) : (
            <div
              style={{ height: 280 }}
              className="flex items-center justify-center rounded-lg bg-surface-2 text-sm text-dim"
            >
              Locating you…
            </div>
          )}

          {routeLoading && <p className="text-sm text-dim">Getting directions…</p>}
          {routeError && <p className="text-sm text-red-400">{routeError}</p>}
          {plannedDistanceKm !== null && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-dim">
                Planned route: <span className="font-semibold">{plannedDistanceKm.toFixed(2)} km</span>
              </p>
              <button type="button" onClick={clearDestination} className="text-xs text-dim underline">
                Clear destination
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleStart}
          className="self-center rounded-full bg-ignite px-8 py-3 text-lg font-bold text-ignite-fg hover:bg-ignite-hover"
        >
          Start recording
        </button>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="flex flex-col gap-4">
        <RouteMap points={points} height={300} plannedRoute={plannedRoute} destination={destination} />
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Duration" value={formatDuration(elapsedMs)} />
          <Stat label="Distance" value={`${distanceKm.toFixed(2)} km`} />
          <Stat label="Pace" value={formatPaceMinKm(durationMin, distanceKm)} />
        </div>
        <form action={saveTrackedWorkout} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
          <input type="hidden" name="date" value={new Date().toISOString().slice(0, 10)} />
          <input type="hidden" name="durationMin" value={durationMin.toFixed(2)} />
          <input type="hidden" name="distanceKm" value={distanceKm.toFixed(3)} />
          <input type="hidden" name="routePoints" value={JSON.stringify(points)} />
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select
              name="type"
              defaultValue="Run"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-hi focus:border-ignite focus:outline-none"
            >
              <option value="Run">Run</option>
              <option value="Walk">Walk</option>
              <option value="Hike">Hike</option>
            </select>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-ignite px-4 py-2 text-sm font-bold text-ignite-fg hover:bg-ignite-hover"
            >
              Save workout
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-md px-4 py-2 text-sm text-dim underline"
            >
              Discard
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <RouteMap points={points} height={300} live plannedRoute={plannedRoute} destination={destination} />

      <div className={`grid gap-3 ${destination ? "grid-cols-2" : "grid-cols-1"}`}>
        <HeroStat label="Distance" value={`${distanceKm.toFixed(2)} km`} />
        {destination && (
          <HeroStat
            label={arrived ? "Arrived!" : "To destination"}
            value={arrived ? "🎉" : `${remainingKm!.toFixed(2)} km`}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Duration" value={formatDuration(elapsedMs)} />
        <Stat label="Pace" value={formatPaceMinKm(durationMin, distanceKm)} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-center gap-3">
        {status === "recording" ? (
          <button
            onClick={handlePause}
            className="rounded-full border border-border bg-surface-2 px-6 py-3 font-bold text-hi hover:bg-border"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="rounded-full border border-border bg-surface-2 px-6 py-3 font-bold text-hi hover:bg-border"
          >
            Resume
          </button>
        )}
        <button
          onClick={handleFinish}
          className="rounded-full bg-red-500 px-6 py-3 font-bold text-white shadow-sm hover:bg-red-600"
        >
          Finish
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-dimmer">{label}</p>
      <p className="font-display text-lg font-bold text-hi">{value}</p>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ignite/30 bg-ignite/10 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-ignite-hover">{label}</p>
      <p className="font-display text-3xl font-extrabold text-ignite-hover">{value}</p>
    </div>
  );
}
