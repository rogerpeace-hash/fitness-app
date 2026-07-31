"use client";

import { MapContainer, TileLayer, Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

function ClickHandler({ onPick }: { onPick: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function PlannerMap({
  origin,
  destination,
  routeCoords,
  onPick,
}: {
  origin: LatLng;
  destination: LatLng | null;
  routeCoords: LatLng[] | null;
  onPick: (ll: LatLng) => void;
}) {
  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={15}
      style={{ height: 280, width: "100%" }}
      className="z-0 rounded-md"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <CircleMarker
        center={[origin.lat, origin.lng]}
        radius={7}
        pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 1 }}
      />
      {destination && (
        <CircleMarker
          center={[destination.lat, destination.lng]}
          radius={7}
          pathOptions={{ color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }}
        />
      )}
      {routeCoords && routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords.map((p): [number, number] => [p.lat, p.lng])}
          pathOptions={{ color: "#2563eb", weight: 4, dashArray: "6 6" }}
        />
      )}
    </MapContainer>
  );
}
