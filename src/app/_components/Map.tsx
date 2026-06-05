// src/app/_components/Map.tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";

interface ChlorophyllSpot {
  lat: number;
  lng: number;
  value: number;
}

export default function Map() {
  const [spots, setSpots] = useState<ChlorophyllSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data lewat API route, server-side yang handle loading file besarnya
    fetch("/api/chlorophyll")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSpots(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal mengambil data via API:", err);
        setLoading(false);
      });
  }, []);

  const getColor = (value: number) => {
    return value > 1.0
      ? "#006837"
      : value > 0.5
        ? "#31a354"
        : value > 0.2
          ? "#78c679"
          : "#c2e699";
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
        <p className="animate-pulse text-sm">
          Mengunduh Koordinat Klorofil dari Server...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
          {spots.map((spot, idx) => (
            <CircleMarker
              key={idx}
              center={[spot.lat, spot.lng]}
              radius={5}
              fillColor={getColor(spot.value)}
              color="none"
              fillOpacity={0.8}
            >
              <Popup>
                <div className="text-xs">
                  <b>Klorofil-a:</b> {spot.value.toFixed(4)} mg/m³
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
