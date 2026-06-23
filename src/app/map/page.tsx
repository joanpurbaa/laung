"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "../_components/Navbar";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Users,
  UserCheck,
  X,
  AlertTriangle,
  Navigation,
  BarChart3,
  Layers,
  TriangleAlert,
} from "lucide-react";
import { useFleetTracking, type FleetMember } from "~/hooks/useFleetTracking";
import type { TidePoint } from "~/types/tide";
import {
  sendSOSAction,
  getActiveSharelockUsersAction,
} from "~/lib/actions/location";
import FamilyContactModal from "../_components/FamilyContactModal";

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

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: "info" | "danger" | "success";
  action: () => void | Promise<void>;
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

const baseOrigin = { lat: -6.48, lng: 108.6 };

export default function Map() {
  const [viewMode, setViewMode] = useState<
    "zppi" | "chlorophyll" | "sst" | "tides"
  >("zppi");
  const [fishType, setFishType] = useState<
    "umum" | "tongkol" | "tuna" | "kembung"
  >("umum");
  const [, setTideData] = useState<TidePoint[]>([]);
  const [zppiSpots, setZppiSpots] = useState<GeoSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<GeoSpot | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
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
  const [, setActiveSharedMemberId] = useState<string | null>(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedMemberForDetail, setSelectedMemberForDetail] =
    useState<FleetMember | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null,
  );

  const [activeTab, setActiveTab] = useState<"rute" | "analisis" | "top_spot">(
    "rute",
  );

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
    fetch("/api/tides")
      .then((r) => r.json())
      .then((tides) => {
        if (Array.isArray(tides)) setTideData(tides);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    setSheetExpanded(false);

    fetch(`/api/zppi?fish=${fishType}`)
      .then((r) => r.json())
      .then((zppi) => {
        if (Array.isArray(zppi)) {
          setZppiSpots(zppi);
          const sorted = [...zppi].sort((a, b) => b.value - a.value);
          if (sorted.length > 0) setSelectedSpot(sorted[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fishType]);

  const sortedSpots = useMemo(() => {
    if (zppiSpots.length === 0) return [];
    return [...zppiSpots].sort((a, b) => b.value - a.value);
  }, [zppiSpots]);

  const topSpot = sortedSpots[0] ?? null;
  const topSpots = useMemo(() => sortedSpots.slice(0, 3), [sortedSpots]);

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

  const handleSpotSelect = useCallback((spot: GeoSpot) => {
    setSelectedSpot(spot);
    setSheetExpanded(true);
    setActiveTab("rute");
  }, []);

  const handleRecenter = () => setRecenterTrigger((n) => n + 1);

  const handleSOSReceived = useCallback((member: FleetMember) => {
    setSOSAlert(member);
    setTimeout(() => setSOSAlert(null), 30000);
  }, []);

  const {
    fleetMembers,
    myLocation,
    toggleSharing,
    incomingSenders,
    outgoingTargets,
    sharelockToUser,
    unsharelockFromUser,
  } = useFleetTracking({
    isSharing,
    myUserId: session?.user?.id,
    onSOSReceived: handleSOSReceived,
  });

  const fetchActiveUsers = async () => {
    const res = await getActiveSharelockUsersAction();
    if (res.success) {
      setActiveUsersList(res.data);
    } else {
      alert("Gagal mengambil daftar nelayan");
    }
  };

  const handleToggleSharingClick = async () => {
    if (!isSharing) {
      setConfirmDialog({
        isOpen: true,
        title: "Aktifkan Sharelock?",
        message:
          "Anda akan masuk ke lobi dan bisa melihat nelayan lain. Nelayan lain belum bisa melihat Anda sampai Anda membagikannya.",
        confirmText: "Ya, Masuk Lobi",
        type: "success",
        action: async () => {
          setIsSharing(true);
          await toggleSharing(true);
          await fetchActiveUsers();
          setShowActiveUsersModal(true);

          // 🚨 PEMICU IZIN NOTIFIKASI OTOMATIS
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
              await Notification.requestPermission();
            }
          }
        },
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: "Masuk Mode Siluman?",
        message:
          "Matikan Sharelock? Anda tidak akan bisa melihat nelayan lain, dan nelayan lain tidak bisa melihat Anda.",
        confirmText: "Ya, Matikan",
        type: "danger",
        action: async () => {
          setIsSharing(false);
          await toggleSharing(false);
          setShowActiveUsersModal(false);
          setSelectedMemberForDetail(null);
        },
      });
    }
  };

  const confirmShareToUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Bagikan Lokasi?",
      message: `Bagikan lokasimu secara langsung ke ${userName}? Mereka akan bisa melihat posisposimu di peta.`,
      confirmText: "Bagikan",
      type: "success",
      action: async () => {
        await sharelockToUser(userId);
      },
    });
  };

  const confirmUnshareFromUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cabut Akses Lokasi?",
      message: `Berhenti membagikan lokasi ke ${userName}? Mereka tidak akan bisa lagi melihat posisimu.`,
      confirmText: "Cabut Akses",
      type: "danger",
      action: async () => {
        await unsharelockFromUser(userId);
        setSelectedMemberForDetail(null);
      },
    });
  };

  const handleSendSOSFromCardClick = () => {
    if (!myLocation) {
      alert("GPS belum siap");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "DARURAT SOS",
      message:
        "Kirim sinyal bahaya sekarang? Semua nelayan dalam radius 50km akan diberitahu lokasi akurat Anda.",
      confirmText: "KIRIM SOS SEKARANG",
      type: "danger",
      action: async () => {
        const result = await sendSOSAction({
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          message: "Butuh bantuan segera!",
        });
        if (result.success) {
          alert("Sinyal SOS telah dikirim ke seluruh armada terdekat!");
        }
        setSelectedMemberForDetail(null);
      },
    });
  };

  const handleMapMemberSelect = (memberId: string | null) => {
    setActiveSharedMemberId(memberId);
    if (memberId) {
      const member = fleetMembers.find((m) => m.userId === memberId) ?? null;

      setSelectedMemberForDetail(member);
    } else {
      setSelectedMemberForDetail(null);
    }
  };

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-slate-900 select-none"
      style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
    >
      <div className="absolute inset-0 z-0">
        <FishingMap
          viewMode={viewMode}
          selectedSpot={selectedSpot}
          onSpotSelect={handleSpotSelect}
          fishType={fishType}
          baseOrigin={baseOrigin}
          userLocation={userLocation}
          recenterTrigger={recenterTrigger}
          fleetMembers={fleetMembers}
          myLocation={myLocation}
          selectedMemberId={selectedMemberForDetail?.userId ?? null}
          onSelectMember={handleMapMemberSelect}
        />
      </div>

      <div className="absolute top-0 right-0 left-0 z-10 px-3 pt-3 pb-2">
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
              <div className="mt-0.5 flex items-center gap-1">
                {gpsActive ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-600">
                      GPS Terhubung
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    <span className="text-[9px] font-bold text-amber-600">
                      Menunggu GPS…
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
              className="relative z-10 flex h-[52px] items-center gap-1.5 rounded-2xl border border-white/60 bg-white/90 px-3 shadow-lg backdrop-blur-md"
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
              <div className="absolute top-full right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFishDropdown && (
        <div
          className="absolute inset-0 z-20"
          onClick={() => setShowFishDropdown(false)}
        />
      )}

      {sosAlert && (
        <div className="animate-in fade-in slide-in-from-top-4 absolute top-20 right-4 left-4 z-40 rounded-2xl border border-red-200 bg-red-500 p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <TriangleAlert className="text-white" />
            <div className="flex-1">
              <p className="text-[13px] font-black text-white">
                Sinyal SOS Diterima!
              </p>
              <p className="text-[11px] font-medium text-red-100">
                Nelayan butuh bantuan di koordinat{" "}
                {sosAlert.latitude.toFixed(4)}, {sosAlert.longitude.toFixed(4)}
              </p>
            </div>
            <button onClick={() => setSOSAlert(null)} className="text-red-200">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2">
        {LAYER_OPTIONS.map((layer) => (
          <button
            key={layer.value}
            onClick={() =>
              layer.value === "pesan"
                ? setShowFamilyModal(true)
                : setViewMode(layer.value)
            }
            className={`flex h-11 w-11 flex-col items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
              viewMode === layer.value
                ? "border-emerald-300 bg-emerald-500 text-white shadow-emerald-200"
                : "border-white/60 bg-white/90 text-slate-600"
            }`}
          >
            <span className="text-base leading-none">{layer.icon}</span>
            <span className="mt-0.5 text-[8px] font-bold">{layer.label}</span>
          </button>
        ))}

        <button
          onClick={handleRecenter}
          className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-blue-500 shadow-lg backdrop-blur-md"
        >
          <svg
            className="h-5 w-5"
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
          </svg>
          <span className="mt-0.5 text-[8px] font-bold">GPS</span>
        </button>
      </div>

      {selectedMemberForDetail && (
        <div className="animate-in fade-in slide-in-from-top-4 absolute top-24 right-4 left-4 z-30 max-w-sm duration-200 sm:mx-auto">
          <div
            className="w-full rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${selectedMemberForDetail.isSOS ? "animate-ping bg-red-500" : "bg-blue-500"}`}
                />
                <h4 className="text-sm font-black text-slate-800">
                  {selectedMemberForDetail.userName ?? "Nelayan"}
                  {selectedMemberForDetail.isSOS && (
                    <span className="ml-1 text-xs font-extrabold text-red-600">
                      (DARURAT)
                    </span>
                  )}
                </h4>
              </div>
              <button
                onClick={() => setSelectedMemberForDetail(null)}
                className="rounded-lg p-1 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              {outgoingTargets.has(selectedMemberForDetail.userId) ? (
                <button
                  onClick={() =>
                    confirmUnshareFromUser(
                      selectedMemberForDetail.userId,
                      selectedMemberForDetail.userName ?? "Nelayan",
                    )
                  }
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600"
                >
                  Cabut Akses Lokasi
                </button>
              ) : (
                <button
                  onClick={() =>
                    confirmShareToUser(
                      selectedMemberForDetail.userId,
                      selectedMemberForDetail.userName ?? "Nelayan",
                    )
                  }
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white"
                >
                  Bagikan Lokasiku
                </button>
              )}
              <button
                onClick={handleSendSOSFromCardClick}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-600 py-2 text-xs font-black text-white"
              >
                <AlertTriangle size={14} /> SOS
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute right-4 bottom-24 z-10 flex flex-col items-end gap-3">
        <button
          onClick={handleToggleSharingClick}
          className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-black shadow-lg transition-all active:scale-95 ${
            isSharing
              ? "bg-emerald-500 text-white shadow-emerald-200"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          {isSharing ? <UserCheck size={14} /> : <Users size={14} />}
          {isSharing ? "Lobi Armada Aktif" : "Bagikan Lokasi"}
        </button>
      </div>

      <div className="absolute right-0 bottom-4 left-0 z-10">
        {!sheetExpanded ? (
          <div className="mx-3">
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
                        Spot Utama · Hemat {fuelSavingPercent}% Solar
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {userLocation
                          ? `${distance.toFixed(1)} Km dari posisimu`
                          : "Menunggu GPS…"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                      Tap Detail
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
            </button>
          </div>
        ) : (
          <div className="mx-3 flex h-[260px] flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/97 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setSheetExpanded(false)}
              className="flex w-full shrink-0 flex-col items-center border-b border-slate-100 bg-slate-50 pt-2 pb-1"
            >
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </button>

            {selectedSpot ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-md px-1.5 py-0.5 text-[9px] font-black text-white uppercase"
                      style={{ backgroundColor: scoreInfo?.color }}
                    >
                      {scoreInfo?.label} ({selectedSpot.value})
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {selectedSpot.lat.toFixed(4)},{" "}
                      {selectedSpot.lng.toFixed(4)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSheetExpanded(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                  >
                    Tutup
                  </button>
                </div>

                <div className="flex shrink-0 border-b border-slate-100 bg-white">
                  <button
                    onClick={() => setActiveTab("rute")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold transition-all ${activeTab === "rute" ? "border-emerald-500 bg-emerald-50/30 text-emerald-600" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Navigation size={12} /> Info Rute
                  </button>
                  <button
                    onClick={() => setActiveTab("analisis")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold transition-all ${activeTab === "analisis" ? "border-emerald-500 bg-emerald-50/30 text-emerald-600" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
                  >
                    <BarChart3 size={12} /> Analisis Satelit
                  </button>
                  <button
                    onClick={() => setActiveTab("top_spot")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-bold transition-all ${activeTab === "top_spot" ? "border-emerald-500 bg-emerald-50/30 text-emerald-600" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Layers size={12} /> Spot Lain
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-white p-4">
                  {activeTab === "rute" && (
                    <div className="animate-in fade-in space-y-3 duration-150">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-slate-50 p-2 text-center">
                          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                            Jarak
                          </p>
                          <p className="text-base font-black text-slate-800">
                            {userLocation ? `${distance.toFixed(1)} Km` : "—"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2 text-center">
                          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                            Waktu Tempuh
                          </p>
                          <p className="text-base font-black text-slate-800">
                            {userLocation
                              ? `${Math.round(distance * 3.2)} Mnt`
                              : "—"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-emerald-500 p-2 text-center text-white shadow-sm shadow-emerald-100">
                          <p className="text-[9px] font-bold tracking-wider text-emerald-100 uppercase">
                            Hemat Solar
                          </p>
                          <p className="text-base font-black">
                            {userLocation ? `${fuelSavingPercent}%` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400">
                            Rute Normal:
                          </span>{" "}
                          <span className="font-bold text-red-500 line-through">
                            {traditionalFuel} Liter
                          </span>
                        </div>
                        <div className="text-slate-300">➔</div>
                        <div>
                          <span className="text-[10px] text-slate-400">
                            Rute ZPPI:
                          </span>{" "}
                          <span className="font-bold text-emerald-600">
                            {zppiFuel} Liter
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "analisis" && (
                    <div className="animate-in fade-in space-y-2.5 duration-150">
                      {selectedSpot.breakdown ? (
                        <div className="space-y-2">
                          <div>
                            <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>
                                🌿 Klorofil-a (
                                {selectedSpot.breakdown.chlorValue.toFixed(2)}{" "}
                                mg/m³)
                              </span>
                              <span className="font-bold text-emerald-600">
                                +{selectedSpot.breakdown.chlorCont} pts
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-400"
                                style={{
                                  width: `${selectedSpot.breakdown.chlorCont}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>
                                🌡️ Suhu Permukaan (
                                {selectedSpot.breakdown.sstValue.toFixed(1)} °C)
                              </span>
                              <span className="font-bold text-blue-600">
                                +{selectedSpot.breakdown.sstCont} pts
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-400"
                                style={{
                                  width: `${selectedSpot.breakdown.sstCont}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>🌊 Kontribusi Pasut Alami</span>
                              <span className="font-bold text-cyan-600">
                                +{selectedSpot.breakdown.tideCont} pts
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{
                                  width: `${selectedSpot.breakdown.tideCont}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">
                          Data kriteria satelit tidak tersedia.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === "top_spot" && (
                    <div className="animate-in fade-in flex gap-2 duration-150">
                      {topSpots.map((spot, i) => {
                        const isActive =
                          selectedSpot?.lat === spot.lat &&
                          selectedSpot?.lng === spot.lng;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSpot(spot)}
                            className={`flex flex-1 flex-col items-center rounded-xl border py-2.5 transition-all ${isActive ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                          >
                            <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                              Spot {String.fromCharCode(65 + i)}
                            </span>
                            <span
                              className="mt-0.5 text-sm font-black"
                              style={{ color: getScoreLabel(spot.value).color }}
                            >
                              {spot.value}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 pb-4 text-center text-sm text-slate-400">
                Pilih titik pada peta
              </div>
            )}
          </div>
        )}
      </div>

      <Navbar />
      <FamilyContactModal
        isOpen={showFamilyModal}
        onClose={() => setShowFamilyModal(false)}
      />

      {showActiveUsersModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setShowActiveUsersModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-black text-slate-800">
                Lobi Nelayan Aktif
              </h4>
              <button
                onClick={() => setShowActiveUsersModal(false)}
                className="rounded-lg p-1 transition hover:bg-slate-100"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {activeUsersList.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Belum ada nelayan lain di Lobi.
                </p>
              ) : (
                activeUsersList.map((user) => {
                  const alreadyShared = outgoingTargets.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between rounded-2xl border p-3 transition-colors ${alreadyShared ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100"}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {user.name}
                        </p>
                        <p
                          className={`text-[10px] ${alreadyShared ? "font-semibold text-emerald-500" : "text-slate-400"}`}
                        >
                          {alreadyShared
                            ? "✓ Akses diberikan"
                            : "Belum ada akses"}
                        </p>
                      </div>

                      {alreadyShared ? (
                        <button
                          onClick={() =>
                            confirmUnshareFromUser(user.id, user.name)
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
                        >
                          Cabut Akses
                        </button>
                      ) : (
                        <button
                          onClick={() => confirmShareToUser(user.id, user.name)}
                          className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
                        >
                          Bagikan
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <button
              onClick={() => setShowActiveUsersModal(false)}
              className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95"
            >
              Tutup Lobi
            </button>
            <button
              onClick={handleSendSOSFromCardClick}
              className="mt-3 w-full rounded-xl border border-red-400 bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 active:scale-95"
            >
              Kirim Sinyal SOS
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="animate-in fade-in absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md duration-200">
          <div className="scale-in-95 mx-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
              {confirmDialog.type === "danger" && (
                <AlertTriangle size={20} className="text-red-500" />
              )}
              {confirmDialog.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {confirmDialog.message}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  await confirmDialog.action();
                  setConfirmDialog(null);
                }}
                className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-sm transition active:scale-95 ${
                  confirmDialog.type === "danger"
                    ? "bg-red-500 shadow-red-200 hover:bg-red-600"
                    : "bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600"
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
