"use client";

import { useMemo } from "react";
import L from "leaflet";
import { LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { GeocodeLocation } from "@/lib/types";

type LocationMapProps = {
  locations: GeocodeLocation[];
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LocationMap({ locations }: LocationMapProps) {
  const validLocations = useMemo(
    () =>
      locations.filter(
        (location) => Number.isFinite(location.latitude) && Number.isFinite(location.longitude),
      ),
    [locations],
  );

  if (validLocations.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-slate-200 text-slate-500 sm:h-[420px]">
        No valid map coordinates available.
      </div>
    );
  }

  const center: [number, number] = [validLocations[0].latitude, validLocations[0].longitude];
  const bounds: LatLngBoundsExpression | undefined =
    validLocations.length > 1
      ? validLocations.map((location) => [location.latitude, location.longitude] as [number, number])
      : undefined;

  const mapKey = validLocations
    .map((location) => `${location.latitude.toFixed(5)}:${location.longitude.toFixed(5)}`)
    .join("|");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={12}
        bounds={bounds}
        boundsOptions={{ padding: [30, 30] }}
        className="h-[320px] w-full sm:h-[420px]"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocations.map((location, index) => (
          <Marker
            key={`${location.name}-${location.latitude}-${location.longitude}-${index}`}
            position={[location.latitude, location.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{location.name}</strong>
              <br />
              {location.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
