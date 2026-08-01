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
        className="flex items-center justify-center rounded-lg bg-surface-2 text-sm text-dim"
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {plannedRoute && plannedRoute.length > 0 && (
        <Polyline
          positions={plannedRoute.map((p): [number, number] => [p.lat, p.lng])}
          pathOptions={{ color: "#94a3b8", weight: 4, dashArray: "6 8" }}
        />
      )}
      {hasTraveled && <Polyline positions={latlngs} pathOptions={{ color: "#ff7333", weight: 4 }} />}
      {hasTraveled && (
        <CircleMarker
          center={latlngs[0]}
          radius={6}
          pathOptions={{ color: "#5be479", fillColor: "#5be479", fillOpacity: 1 }}
        />
      )}
      {hasTraveled && (
        <CircleMarker
          center={latlngs[latlngs.length - 1]}
          radius={6}
          pathOptions={{ color: "#ff7333", fillColor: "#ff7333", fillOpacity: 1 }}
        />
      )}
      {destination && (
        <CircleMarker
          center={[destination.lat, destination.lng]}
          radius={8}
          pathOptions={{ color: "#6ab3fd", fillColor: "#111826", fillOpacity: 1, weight: 3 }}
        />
      )}
      {live && hasTraveled && <RecenterOnChange center={last} />}
    </MapContainer>
  );
}
