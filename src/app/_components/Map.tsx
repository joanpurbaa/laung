"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
  ZoomControl,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// const customMarkerIcon = new L.Icon({
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// });

const pulsingDotIcon = (color = "#3b82f6") =>
  L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;
          width:20px;height:20px;
          border-radius:50%;
          background:${color};
          opacity:0.25;
          animation:zppi-pulse 1.8s ease-out infinite;
        "></div>
        <div style="
          position:absolute;
          width:32px;height:32px;
          border-radius:50%;
          background:${color};
          opacity:0.12;
          animation:zppi-pulse 1.8s ease-out infinite 0.3s;
        "></div>
        <div style="
          position:relative;
          width:12px;height:12px;
          border-radius:50%;
          background:${color};
          border:2.5px solid white;
          box-shadow:0 0 0 1.5px ${color};
        "></div>
      </div>
      <style>
        @keyframes zppi-pulse {
          0%  { transform:scale(0.8); opacity:0.4; }
          70% { transform:scale(2.2); opacity:0; }
          100%{ transform:scale(0.8); opacity:0; }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

interface GeoSpot {
  lat: number;
  lng: number;
  value: number;
  breakdown?: {
    chlorValue: number;
    sstValue: number;
    chlorCont: number;
    sstCont: number;
    tideCont: number;
  };
}

interface MapProps {
  viewMode: "zppi" | "chlorophyll" | "sst" | "tides";
  selectedSpot: GeoSpot | null;
  onSpotSelect: (spot: GeoSpot) => void;
  fishType: string;
  baseOrigin: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  recenterTrigger: number;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] leading-tight font-medium text-slate-600">
        {label}
      </span>
    </div>
  );
}

function RecenterController({
  userLocation,
  recenterTrigger,
  baseOrigin,
}: {
  userLocation: { lat: number; lng: number } | null;
  recenterTrigger: number;
  baseOrigin: { lat: number; lng: number };
}) {
  const map = useMap();
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (recenterTrigger !== prevTrigger.current) {
      prevTrigger.current = recenterTrigger;
      const target = userLocation ?? baseOrigin;
      map.flyTo([target.lat, target.lng], 11, { animate: true, duration: 1.2 });
    }
  }, [recenterTrigger, userLocation, baseOrigin, map]);

  return null;
}

export default function Map({
  viewMode,
  selectedSpot,
  onSpotSelect,
  fishType,
  baseOrigin,
  userLocation,
  recenterTrigger,
}: MapProps) {
  const [chlorophyllSpots, setChlorophyllSpots] = useState<GeoSpot[]>([]);
  const [sstSpots, setSstSpots] = useState<GeoSpot[]>([]);
  const [zppiSpots, setZppiSpots] = useState<GeoSpot[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/chlorophyll").then((r) => r.json()),
      fetch("/api/sst").then((r) => r.json()),
      fetch(`/api/zppi?fish=${fishType}`).then((r) => r.json()),
    ])
      .then(([chlorData, sstData, zppiData]) => {
        if (Array.isArray(chlorData))
          setChlorophyllSpots(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            chlorData.filter((s) => s.value > 0.01 && s.lat < -6.15),
          );
        if (Array.isArray(sstData))
          setSstSpots(
            sstData.filter(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              (s) => s.value >= 26.0 && s.value <= 32.0 && s.lat < -6.15,
            ),
          );
        if (Array.isArray(zppiData)) setZppiSpots(zppiData);
      })
      .catch((err) => console.error("Gagal memuat data koordinat peta:", err));
  }, [fishType]);

  const getChlorophyllColor = (v: number) =>
    v > 1.0 ? "#006837" : v > 0.5 ? "#31a354" : v > 0.2 ? "#78c679" : "#c2e699";

  const getSstColor = (t: number) =>
    t > 30.5
      ? "#d73027"
      : t > 29.5
        ? "#fdae61"
        : t > 28.5
          ? "#fee090"
          : "#abd9e9";

  const getZppiColor = (s: number) =>
    s >= 85 ? "#059669" : s >= 70 ? "#10b981" : s >= 55 ? "#f59e0b" : "#ef4444";

  const currentSpots =
    viewMode === "sst"
      ? sstSpots
      : viewMode === "zppi" || viewMode === "tides"
        ? zppiSpots
        : chlorophyllSpots;

  const routeOrigin = userLocation ?? baseOrigin;

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-20 right-3 z-1010 w-40 space-y-1 rounded-2xl border border-white/60 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-md">
        {viewMode === "zppi" || viewMode === "tides" ? (
          <>
            <p className="mb-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              ZPPI Skor
            </p>
            <LegendItem color="#059669" label="Sangat Baik ≥ 85" />
            <LegendItem color="#10b981" label="Baik 70–84" />
            <LegendItem color="#f59e0b" label="Sedang 55–69" />
            <LegendItem color="#ef4444" label="Kurang < 55" />
          </>
        ) : viewMode === "chlorophyll" ? (
          <>
            <p className="mb-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              Klorofil
            </p>
            <LegendItem color="#006837" label="> 1.0 mg/m³" />
            <LegendItem color="#31a354" label="0.5–1.0" />
            <LegendItem color="#78c679" label="0.2–0.5" />
            <LegendItem color="#c2e699" label="< 0.2" />
          </>
        ) : (
          <>
            <p className="mb-1.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              Suhu (°C)
            </p>
            <LegendItem color="#d73027" label="> 30.5°C" />
            <LegendItem color="#fdae61" label="29.5–30.5°C" />
            <LegendItem color="#fee090" label="28.5–29.5°C" />
            <LegendItem color="#abd9e9" label="< 28.5°C" />
          </>
        )}
      </div>

      <MapContainer
        center={[-6.48, 108.6]}
        zoom={9}
        minZoom={8}
        maxZoom={12}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <RecenterController
          userLocation={userLocation}
          recenterTrigger={recenterTrigger}
          baseOrigin={baseOrigin}
        />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={pulsingDotIcon("#3b82f6")}
          >
            <Popup>
              <div className="font-sans text-xs font-bold text-blue-700">
                📍 Posisi Kapal Kamu (GPS Live)
                <p className="mt-0.5 font-mono text-[10px] font-normal text-slate-500">
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {selectedSpot && (
          <Polyline
            positions={[
              [routeOrigin.lat, routeOrigin.lng],
              [selectedSpot.lat, selectedSpot.lng],
            ]}
            pathOptions={{
              color: "#0284c7",
              weight: 3,
              dashArray: "8, 8",
              opacity: 0.85,
            }}
          />
        )}

        {currentSpots.map((spot, idx) => {
          const isSelected =
            selectedSpot?.lat === spot.lat && selectedSpot?.lng === spot.lng;
          return (
            <Circle
              key={`${viewMode}-${idx}`}
              center={[spot.lat, spot.lng]}
              radius={isSelected ? 3200 : 2000}
              pathOptions={{
                fillColor:
                  viewMode === "chlorophyll"
                    ? getChlorophyllColor(spot.value)
                    : viewMode === "sst"
                      ? getSstColor(spot.value)
                      : getZppiColor(spot.value),
                fillOpacity: isSelected ? 0.92 : 0.6,
                color: isSelected ? "#0284c7" : "transparent",
                weight: isSelected ? 2.5 : 0,
              }}
              eventHandlers={{ click: () => onSpotSelect(spot) }}
            >
              <Popup>
                <div className="p-0.5 font-sans text-xs">
                  <p className="mb-1 font-bold text-slate-800">
                    Koordinat Tangkap
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Lat: {spot.lat.toFixed(4)}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Lng: {spot.lng.toFixed(4)}
                  </p>
                  <div className="mt-1.5 border-t border-slate-100 pt-1 text-[11px] font-bold text-slate-700">
                    {viewMode === "chlorophyll"
                      ? `🌿 Klorofil: ${spot.value.toFixed(2)} mg/m³`
                      : viewMode === "sst"
                        ? `🌡️ Suhu: ${spot.value.toFixed(1)} °C`
                        : `🎯 ZPPI: ${spot.value} / 100`}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
