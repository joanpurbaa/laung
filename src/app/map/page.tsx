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
  MessageCircle,
  Rocket,
  Leaf,
  Thermometer,
  Satellite,
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
  { value: "pesan", icon: MessageCircle, label: "Pesan" },
  { value: "zppi", icon: Rocket, label: "ZPPI" },
  { value: "chlorophyll", icon: Leaf, label: "Klorofil" },
  { value: "sst", icon: Thermometer, label: "Suhu" },
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
  const [, setActiveSharedMemberId] = useState<string | null>(null);

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

  const [showFamilyModal, setShowFamilyModal] = useState(false);

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
    setShowDetail(false);
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
        {LAYER_OPTIONS.map((layer) => {
          const IconComponent = layer.icon;
          return (
            <button
              key={layer.value}
              onClick={() => {
                if (layer.value === "pesan") {
                  setShowFamilyModal(true);
                } else {
                  setViewMode(layer.value);
                }
              }}
              title={layer.label}
              className={`flex h-11 w-11 flex-col items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
                viewMode === layer.value && layer.value !== "pesan"
                  ? "border-emerald-300 bg-emerald-500 text-white shadow-emerald-200"
                  : "border-white/60 bg-white/90 text-slate-600 hover:bg-white"
              }`}
            >
              <IconComponent size={18} strokeWidth={2} />
              <span className="mt-0.5 text-[8px] font-bold">{layer.label}</span>
            </button>
          );
        })}

        <button
          onClick={handleRecenter}
          className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-blue-500 shadow-lg backdrop-blur-md"
        >
          <Satellite size={18} strokeWidth={2} />
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

      <div className="absolute right-0 bottom-[80px] left-0 z-10 flex flex-col gap-2">
        <div className="mx-3 flex justify-between">
          <div className="flex flex-col items-start gap-3">
            <button
              onClick={handleSendSOSFromCardClick}
              className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-[12px] font-black text-white shadow-lg ring-2 shadow-red-500/40 ring-red-500/20 transition-all hover:bg-red-700 active:scale-95"
            >
              <AlertTriangle size={14} /> DARURAT SOS
            </button>
          </div>
          <div className="flex flex-col items-end gap-3">
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
        </div>

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
          <div className="mx-3 overflow-hidden rounded-3xl border border-white/60 bg-white/97 shadow-2xl backdrop-blur-md">
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
                              style={{
                                color: getScoreLabel(spot.value).color,
                              }}
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
