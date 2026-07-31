"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import type { LatLng, RoutePoint } from "@/lib/geo";

function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(center, { animate: true });
  }, [center, map]);
  return null;
}

export default function RouteMap({
  points,
  height = 300,
  live = false,
  plannedRoute = null,
  destination = null,
}: {
  points: RoutePoint[];
  height?: number;
  live?: boolean;
  plannedRoute?: LatLng[] | null;
  destination?: LatLng | null;
}) {
  const hasTraveled = points.length > 0;
  const fallbackCenter = plannedRoute?.[0] ?? destination ?? null;

  if (!hasTraveled && !fallbackCenter) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500 dark:bg-slate-800"
      >
        Waiting for GPS signal…
      </div>
    );
  }

  const latlngs = points.map((p): [number, number] => [p.lat, p.lng]);
  const last = hasTraveled ? latlngs[latlngs.length - 1] : ([fallbackCenter!.lat, fallbackCenter!.lng] as [number, number]);

  return (
    <MapContainer
      center={last}
      zoom={16}
      style={{ height, width: "100%" }}
      className="z-0 rounded-md"
      scrollWheelZoom={!live}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {plannedRoute && plannedRoute.length > 0 && (
        <Polyline
          positions={plannedRoute.map((p): [number, number] => [p.lat, p.lng])}
          pathOptions={{ color: "#94a3b8", weight: 4, dashArray: "6 8" }}
        />
      )}
      {hasTraveled && <Polyline positions={latlngs} pathOptions={{ color: "#2563eb", weight: 4 }} />}
      {hasTraveled && (
        <CircleMarker
          center={latlngs[0]}
          radius={6}
          pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 1 }}
        />
      )}
      {hasTraveled && (
        <CircleMarker
          center={latlngs[latlngs.length - 1]}
          radius={6}
          pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }}
        />
      )}
      {destination && (
        <CircleMarker
          center={[destination.lat, destination.lng]}
          radius={8}
          pathOptions={{ color: "#dc2626", fillColor: "#ffffff", fillOpacity: 1, weight: 3 }}
        />
      )}
      {live && hasTraveled && <RecenterOnChange center={last} />}
    </MapContainer>
  );
}
