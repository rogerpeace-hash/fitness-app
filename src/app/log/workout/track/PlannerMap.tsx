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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ClickHandler onPick={onPick} />
      <CircleMarker
        center={[origin.lat, origin.lng]}
        radius={7}
        pathOptions={{ color: "#5be479", fillColor: "#5be479", fillOpacity: 1 }}
      />
      {destination && (
        <CircleMarker
          center={[destination.lat, destination.lng]}
          radius={7}
          pathOptions={{ color: "#6ab3fd", fillColor: "#6ab3fd", fillOpacity: 1 }}
        />
      )}
      {routeCoords && routeCoords.length > 0 && (
        <Polyline
          positions={routeCoords.map((p): [number, number] => [p.lat, p.lng])}
          pathOptions={{ color: "#ff7333", weight: 4, dashArray: "6 6" }}
        />
      )}
    </MapContainer>
  );
}
