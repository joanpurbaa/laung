"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "../_components/Navbar";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Users, UserCheck, X } from "lucide-react";
import SOSButton from "../_components/SOSButton";
import { useFleetTracking, type FleetMember } from "~/hooks/useFleetTracking";

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

interface TideData {
  time: string;
  height: number;
  status: string;
}

const FishingMap = dynamic(() => import("../_components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <p className="animate-pulse text-sm font-medium tracking-wide text-slate-500">
        Menyiapkan Sistem Navigasi...
      </p>
    </div>
  ),
});

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LAYER_OPTIONS = [
  { value: "zppi", icon: "🚀", label: "ZPPI" },
  { value: "chlorophyll", icon: "🌿", label: "Klorofil" },
  { value: "sst", icon: "🌡️", label: "Suhu" },
  // { value: "tides", icon: "🌊", label: "Pasut" },
] as const;

const FISH_OPTIONS = [
  { value: "umum", emoji: "🎣", label: "Semua Jenis" },
  { value: "tongkol", emoji: "🐟", label: "Tongkol" },
  { value: "tuna", emoji: "🐠", label: "Tuna" },
  { value: "kembung", emoji: "🐡", label: "Kembung" },
] as const;

function getScoreLabel(score: number) {
  if (score >= 85) return { label: "Sangat Potensial", color: "#059669" };
  if (score >= 70) return { label: "Potensial", color: "#10b981" };
  if (score >= 55) return { label: "Sedang", color: "#f59e0b" };
  return { label: "Rendah", color: "#ef4444" };
}

const KARANGAMPEL = { lat: -6.465, lng: 108.452 };

export default function Map() {
  const [viewMode, setViewMode] = useState<
    "zppi" | "chlorophyll" | "sst" | "tides"
  >("zppi");
  const [fishType, setFishType] = useState<
    "umum" | "tongkol" | "tuna" | "kembung"
  >("umum");
  const [, setTideData] = useState<TideData[]>([]);
  const [zppiSpots, setZppiSpots] = useState<GeoSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<GeoSpot | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const { data: session } = useSession();
  const [isSharing, setIsSharing] = useState(false);
  const [sosAlert, setSOSAlert] = useState<FleetMember | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsActive(true);
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsActive(true);
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setShowDetail(false);
    Promise.all([
      fetch("/api/tides").then((r) => r.json()),
      fetch(`/api/zppi?fish=${fishType}`).then((r) => r.json()),
    ])
      .then(([tides, zppi]) => {
        if (Array.isArray(tides)) setTideData(tides);
        if (Array.isArray(zppi)) {
          setZppiSpots(zppi);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const sorted = [...zppi].sort((a, b) => b.value - a.value);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          if (sorted.length > 0) setSelectedSpot(sorted[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fishType]);

  const topSpot = [...zppiSpots].sort((a, b) => b.value - a.value)[0] ?? null;
  const topSpots = [...zppiSpots].sort((a, b) => b.value - a.value).slice(0, 3);

  const distance =
    selectedSpot && userLocation
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          selectedSpot.lat,
          selectedSpot.lng,
        )
      : 0;
  const traditionalFuel = selectedSpot ? Math.round(distance * 1.5 + 8) : 0;
  const zppiFuel = selectedSpot ? Math.round(distance * 1.05) : 0;
  const fuelSavingPercent =
    traditionalFuel > 0
      ? Math.round(((traditionalFuel - zppiFuel) / traditionalFuel) * 100)
      : 0;

  const activeFish = FISH_OPTIONS.find((f) => f.value === fishType)!;
  const scoreInfo = selectedSpot ? getScoreLabel(selectedSpot.value) : null;

  const handleSpotSelect = (spot: GeoSpot) => {
    setSelectedSpot(spot);
    setSheetExpanded(true);
    setShowDetail(false);
  };

  const handleRecenter = () => setRecenterTrigger((n) => n + 1);

  const handleSOSReceived = useCallback((member: FleetMember) => {
    setSOSAlert(member);
    setTimeout(() => setSOSAlert(null), 30000);
  }, []);

  const { fleetMembers, myLocation, toggleSharing } = useFleetTracking({
    isSharing,
    onSOSReceived: handleSOSReceived,
  });

  const handleToggleSharing = async () => {
    const next = !isSharing;
    setIsSharing(next);
    await toggleSharing(next);
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden select-none"
      style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
    >
      <div className="absolute inset-0 z-0">
        <FishingMap
          viewMode={viewMode}
          onSpotSelect={handleSpotSelect}
          selectedSpot={selectedSpot}
          fishType={fishType}
          baseOrigin={KARANGAMPEL}
          userLocation={userLocation}
          recenterTrigger={recenterTrigger}
          fleetMembers={fleetMembers}
          myLocation={myLocation}
        />
      </div>

      {/* TOP BAR */}
      <div className="absolute top-0 right-0 left-0 z-[1010] px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/60 bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <Image
              className="h-8 w-8"
              src={"/icon.svg"}
              width={100}
              height={100}
              alt="icon"
            />
            <div className="min-w-0 flex-1">
              {/* <p className="truncate text-[11px] font-black tracking-tight text-slate-800">
                Laung Peta Nelayan
              </p> */}
              <div className="mt-0.5 flex items-center gap-1">
                {gpsActive ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-600">
                      GPS Terhubung (Akurasi Tinggi)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    <span className="text-[9px] font-bold text-amber-600">
                      Menunggu sinyal GPS…
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              <span className="text-[9px] font-bold text-blue-600">LIVE</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFishDropdown((v) => !v)}
              className="flex h-[52px] items-center gap-1.5 rounded-2xl border border-white/60 bg-white/90 px-3 shadow-lg backdrop-blur-md"
            >
              <span className="text-base">{activeFish.emoji}</span>
              <svg
                className="h-3 w-3 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showFishDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                {FISH_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setFishType(f.value);
                      setShowFishDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                      fishType === f.value
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm">{f.emoji}</span>
                    {f.label}
                    {fishType === f.value && (
                      <svg
                        className="ml-auto h-3.5 w-3.5 text-emerald-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LAYER SWITCHER */}
      <div className="absolute top-1/2 right-3 z-[1010] flex -translate-y-1/2 flex-col gap-2">
        {LAYER_OPTIONS.map((layer) => (
          <button
            key={layer.value}
            onClick={() => setViewMode(layer.value)}
            title={layer.label}
            className={`flex h-11 w-11 flex-col items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
              viewMode === layer.value
                ? "border-emerald-300 bg-emerald-500 text-white shadow-emerald-200"
                : "border-white/60 bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            <span className="text-base leading-none">{layer.icon}</span>
            <span
              className={`mt-0.5 text-[8px] leading-none font-bold ${viewMode === layer.value ? "text-white/90" : "text-slate-400"}`}
            >
              {layer.label}
            </span>
          </button>
        ))}

        {/* RECENTER BUTTON */}
        <button
          onClick={handleRecenter}
          title="Ke Lokasiku"
          className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/90 shadow-lg backdrop-blur-md transition-all hover:border-blue-200 hover:bg-blue-50 active:scale-95"
        >
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="3" fill="#3b82f6" stroke="none" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2v3m0 14v3M2 12h3m14 0h3"
            />
            <circle cx="12" cy="12" r="7" strokeDasharray="3 2" />
          </svg>
          <span className="mt-0.5 text-[8px] leading-none font-bold text-blue-500">
            GPS
          </span>
        </button>
      </div>

      {/* BOTTOM SHEET (Dimodifikasi: bottom-0 diubah ke bottom-16 agar tidak tertutup navbar) */}
      <div className="absolute right-0 bottom-16 left-0 z-[1010]">
        {!sheetExpanded ? (
          <div className="mx-3 mb-3">
            <button
              onClick={() => setSheetExpanded(true)}
              className="w-full overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                {topSpot && (
                  <>
                    <div
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm"
                      style={{
                        backgroundColor: getScoreLabel(topSpot.value).color,
                      }}
                    >
                      <span className="text-lg leading-none font-black">
                        {topSpot.value}
                      </span>
                      <span className="text-[8px] leading-none font-bold opacity-80">
                        SKOR
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Rekomendasi Terbaik Hari Ini
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        Spot A · Hemat {fuelSavingPercent}% Solar
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {userLocation
                          ? `${distance.toFixed(1)} Km dari posisimu`
                          : "Menunggu GPS…"}{" "}
                        · 09:00–15:00 WIB
                      </p>
                    </div>
                    <div className="shrink-0">
                      <svg
                        className="h-5 w-5 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </div>
                  </>
                )}
                {!topSpot && (
                  <p className="text-sm text-slate-400">
                    {loading
                      ? "Memuat data..."
                      : "Tap untuk melihat rekomendasi"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                <div className="py-2 text-center">
                  <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                    Potensial
                  </p>
                  <p className="text-sm font-black text-emerald-600">
                    {zppiSpots.filter((s) => s.value >= 70).length}
                  </p>
                </div>
                <div className="py-2 text-center">
                  <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                    Sangat Baik
                  </p>
                  <p className="text-sm font-black text-blue-600">
                    {zppiSpots.filter((s) => s.value >= 85).length}
                  </p>
                </div>
                <div className="py-2 text-center">
                  <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                    Kondisi Air
                  </p>
                  <p className="text-sm font-black text-cyan-600">Optimal</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="mx-3 mb-3 overflow-hidden rounded-3xl border border-white/60 bg-white/97 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => {
                setSheetExpanded(false);
                setShowDetail(false);
              }}
              className="flex w-full flex-col items-center pt-3 pb-1"
            >
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </button>

            {selectedSpot ? (
              <div className="px-4 pb-4">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-md"
                    style={{ backgroundColor: scoreInfo?.color }}
                  >
                    <span className="text-2xl leading-none font-black">
                      {selectedSpot.value}
                    </span>
                    <span className="text-[8px] leading-none font-bold uppercase opacity-80">
                      / 100
                    </span>
                  </div>
                  <div className="flex-1">
                    <span
                      className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider text-white uppercase"
                      style={{ backgroundColor: scoreInfo?.color }}
                    >
                      {scoreInfo?.label}
                    </span>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {selectedSpot.lat.toFixed(4)},{" "}
                      {selectedSpot.lng.toFixed(4)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                      {gpsActive
                        ? "📍 Dihitung dari posisi GPS kamu"
                        : "⏳ Menunggu sinyal GPS…"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetail((v) => !v)}
                    className={`rounded-xl border px-3 py-2 text-[10px] font-black tracking-wider uppercase transition-colors ${
                      showDetail
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {showDetail ? "Tutup" : "Detail"}
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-slate-50 p-2.5 text-center">
                    <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                      Jarak
                    </p>
                    <p className="text-base font-black text-slate-800">
                      {userLocation ? distance.toFixed(1) : "—"}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400">
                      Km
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2.5 text-center">
                    <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                      Waktu
                    </p>
                    <p className="text-base font-black text-slate-800">
                      {userLocation ? Math.round(distance * 3.2) : "—"}
                    </p>
                    <p className="text-[9px] font-semibold text-slate-400">
                      Menit
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-500 p-2.5 text-center shadow-sm shadow-emerald-200">
                    <p className="text-[9px] font-bold tracking-wider text-emerald-100 uppercase">
                      Hemat BBM
                    </p>
                    <p className="text-base font-black text-white">
                      {userLocation ? `${fuelSavingPercent}%` : "—"}
                    </p>
                    <p className="text-[9px] font-semibold text-emerald-200">
                      Solar
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                  <div className="text-center">
                    <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                      Metode Acak
                    </p>
                    <p className="text-sm font-black text-red-400 line-through">
                      {traditionalFuel} L
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <div className="h-px w-6 bg-slate-200" />
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <div className="h-px w-6 bg-slate-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                      Rute ZPPI
                    </p>
                    <p className="text-sm font-black text-emerald-600">
                      {zppiFuel} L
                    </p>
                  </div>
                </div>

                {showDetail && selectedSpot.breakdown && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Analisis Multi-Kriteria
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">
                            🌿 Klorofil-a (
                            {selectedSpot.breakdown.chlorValue.toFixed(2)}{" "}
                            mg/m³)
                          </span>
                          <span className="text-[11px] font-black text-emerald-600">
                            +{selectedSpot.breakdown.chlorCont} pts
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${selectedSpot.breakdown.chlorCont}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">
                            🌡️ Suhu Permukaan (
                            {selectedSpot.breakdown.sstValue.toFixed(1)} °C)
                          </span>
                          <span className="text-[11px] font-black text-blue-600">
                            +{selectedSpot.breakdown.sstCont} pts
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-400"
                            style={{
                              width: `${selectedSpot.breakdown.sstCont}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">
                            🌊 Kontribusi Pasut Alami
                          </span>
                          <span className="text-[11px] font-black text-cyan-600">
                            +{selectedSpot.breakdown.tideCont} pts
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-cyan-400"
                            style={{
                              width: `${selectedSpot.breakdown.tideCont}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[10px] leading-relaxed text-slate-500">
                      Titik ini direkomendasikan karena konsentrasi plankton dan
                      suhu permukaan laut mendukung aktivitas makan ikan target
                      secara bersamaan.
                    </p>
                  </div>
                )}

                {!showDetail && (
                  <div>
                    <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Top Spot Lainnya
                    </p>
                    <div className="flex gap-2">
                      {topSpots.map((spot, i) => {
                        const isActive =
                          selectedSpot?.lat === spot.lat &&
                          selectedSpot?.lng === spot.lng;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSpot(spot)}
                            className={`flex flex-1 flex-col items-center rounded-2xl border py-2 transition-all ${
                              isActive
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-100 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                              Spot {String.fromCharCode(65 + i)}
                            </span>
                            <span
                              className="text-sm font-black"
                              style={{ color: getScoreLabel(spot.value).color }}
                            >
                              {spot.value}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 pb-4 text-center text-sm text-slate-400">
                {loading ? "Memuat data ZPPI..." : "Pilih titik pada peta"}
              </div>
            )}
          </div>
        )}
      </div>

      <Navbar />

      {showFishDropdown && (
        <div
          className="absolute inset-0 z-[1005]"
          onClick={() => setShowFishDropdown(false)}
        />
      )}

      {sosAlert && (
        <div className="absolute top-4 right-4 left-4 z-[2000] rounded-2xl border border-red-200 bg-red-500 p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🆘</span>
            <div className="flex-1">
              <p className="text-[13px] font-black text-white">
                Sinyal SOS Diterima!
              </p>
              <p className="text-[11px] font-medium text-red-100">
                Nelayan membutuhkan bantuan di koordinat{" "}
                {sosAlert.latitude.toFixed(4)}, {sosAlert.longitude.toFixed(4)}
              </p>
            </div>
            <button onClick={() => setSOSAlert(null)} className="text-red-200">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="absolute right-4 bottom-24 z-[1000] flex flex-col items-end gap-3">
        <button
          onClick={() => void handleToggleSharing()}
          className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-black shadow-lg transition-all active:scale-95 ${
            isSharing
              ? "bg-emerald-500 text-white shadow-emerald-200"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          {isSharing ? <UserCheck size={14} /> : <Users size={14} />}
          {isSharing
            ? `${fleetMembers.length} Nelayan Online`
            : "Bagikan Lokasi"}
        </button>

        {/* SOS Button */}
        {session?.user && <SOSButton />}
      </div>
    </main>
  );
}
