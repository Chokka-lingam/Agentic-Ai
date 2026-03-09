"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { GeocodeLocation } from "@/lib/types";

type LocationMapProps = {
  location: GeocodeLocation;
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LocationMap({ location }: LocationMapProps) {
  const center: [number, number] = useMemo(
    () => [location.latitude, location.longitude],
    [location.latitude, location.longitude],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={center} zoom={12} className="h-[320px] w-full sm:h-[420px]" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={markerIcon}>
          <Popup>
            <strong>{location.name}</strong>
            <br />
            {location.description}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
