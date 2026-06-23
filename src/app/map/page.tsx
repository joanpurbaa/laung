"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "../_components/Navbar";
import Image from "next/image";
import { useSession } from "next-auth/react";
<<<<<<< Updated upstream
import { Users, UserCheck, X, Send, Navigation } from "lucide-react"; // Tambah Send & Navigation buat estetika UI
import SOSButton from "../_components/SOSButton";
import { useFleetTracking, type FleetMember } from "~/hooks/useFleetTracking";
import type { TidePoint } from "~/types/tide";
import { shareSpotAction } from "~/lib/actions/location";
=======
import { Users, UserCheck, X, AlertTriangle, Navigation, BarChart3, Layers } from "lucide-react";
import SOSButton from "../_components/SOSButton";
import { useFleetTracking, type FleetMember } from "~/hooks/useFleetTracking";
import type { TidePoint } from "~/types/tide";
import {
  shareSpotAction,
  sendSOSAction,
  getActiveSharelockUsersAction,
} from "~/lib/actions/location";
import FamilyContactModal from "../_components/FamilyContactModal";
>>>>>>> Stashed changes

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
  const [viewMode, setViewMode] = useState<"zppi" | "chlorophyll" | "sst" | "tides">("zppi");
  const [fishType, setFishType] = useState<"umum" | "tongkol" | "tuna" | "kembung">("umum");
  const [, setTideData] = useState<TidePoint[]>([]);
  const [zppiSpots, setZppiSpots] = useState<GeoSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<GeoSpot | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const { data: session } = useSession();
  
  const [isSharing, setIsSharing] = useState(false);
  const [sosAlert, setSOSAlert] = useState<FleetMember | null>(null);
<<<<<<< Updated upstream
  const [activeSharedMemberId, setActiveSharedMemberId] = useState<string | null>(null);
  const [sharedSpotMemberId, setSharedSpotMemberId] = useState<string | null>(null);
  //state baru buat line antara nelayan
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // ─── STATE BARU UNTUK MODAL LIST NELAYAN ───
  const [showFleetModal, setShowFleetModal] = useState(false);
=======
  const [, setActiveSharedMemberId] = useState<string | null>(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
>>>>>>> Stashed changes

  // P2P States
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersList, setActiveUsersList] = useState<{ id: string; name: string }[]>([]);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<FleetMember | null>(null);

  // Global Confirmation State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // State Menu Tab Internal Sheet Bawah
  const [activeTab, setActiveTab] = useState<"rute" | "analisis" | "top_spot">("rute");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsActive(true);
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsActive(true);
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setSheetExpanded(false);
    Promise.all([
      fetch("/api/tides").then((r) => r.json()),
      fetch(`/api/zppi?fish=${fishType}`).then((r) => r.json()),
    ])
      .then(([tides, zppi]) => {
        if (Array.isArray(tides)) setTideData(tides);
        if (Array.isArray(zppi)) {
          setZppiSpots(zppi);
          const sorted = [...zppi].sort((a, b) => b.value - a.value);
          if (sorted.length > 0) setSelectedSpot(sorted[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fishType]);

  const topSpot = [...zppiSpots].sort((a, b) => b.value - a.value)[0] ?? null;
  const topSpots = [...zppiSpots].sort((a, b) => b.value - a.value).slice(0, 3);

  const distance = selectedSpot && userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, selectedSpot.lat, selectedSpot.lng)
    : 0;
  const traditionalFuel = selectedSpot ? Math.round(distance * 1.5 + 8) : 0;
  const zppiFuel = selectedSpot ? Math.round(distance * 1.05) : 0;
  const fuelSavingPercent = traditionalFuel > 0 ? Math.round(((traditionalFuel - zppiFuel) / traditionalFuel) * 100) : 0;

  const activeFish = FISH_OPTIONS.find((f) => f.value === fishType)!;
  const scoreInfo = selectedSpot ? getScoreLabel(selectedSpot.value) : null;

  const handleSpotSelect = (spot: GeoSpot) => {
    setSelectedSpot(spot);
    setSheetExpanded(true);
    setActiveTab("rute"); // Reset tab ke info utama pas ganti spot
  };

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
  // cek member yg bisa di lihat:
useEffect(() => {
  console.log("👤 UserID saya:", session?.user?.id);
  console.log("⚓ Daftar teman yang bisa dilihat:", incomingSenders);
  console.log("🚢 Jumlah nelayan di fleetMembers:", fleetMembers.length);
}, [fleetMembers, incomingSenders, session?.user?.id]);

  const fetchActiveUsers = async () => {
    const res = await getActiveSharelockUsersAction();
    if (res.success) {
      setActiveUsersList(res.data);
    } else {
      alert("Gagal mengambil daftar nelayan");
    }
  };

<<<<<<< Updated upstream
  // ─── FUNGSI UNTUK BAGI KOORDINAT SPOT KE NELAYAN TERTENTU ───
 const handleShareSpotToFisher = async (fisher: FleetMember) => {
    if (!selectedSpot) {
      alert("Pilih koordinat spot ZPPI di peta terlebih dahulu!");
      return;
    }
    
    // 1. Tampilkan log payload sesuai instruksi template ketua lu
    console.log(`Mengirim Spot (${selectedSpot.lat}, ${selectedSpot.lng}) ke Nelayan: ${fisher.userName}`);
    
    // 2. Eksekusi Server Action untuk simpan ke database via Prisma
    const result = await shareSpotAction({
      recipientId: fisher.userId,
      latitude: selectedSpot.lat,
      longitude: selectedSpot.lng,
=======
  const handleToggleSharingClick = async () => {
    if (!isSharing) {
      setConfirmDialog({
        isOpen: true,
        title: "Aktifkan Sharelock?",
        message: "Anda akan masuk ke lobi dan bisa melihat nelayan lain. Nelayan lain belum bisa melihat Anda sampai Anda membagikannya.",
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
        }
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: "Masuk Mode Siluman?",
        message: "Matikan Sharelock? Anda tidak akan bisa melihat nelayan lain, dan nelayan lain tidak bisa melihat Anda.",
        confirmText: "Ya, Matikan",
        type: "danger",
        action: async () => {
          setIsSharing(false);
          await toggleSharing(false);
          setShowActiveUsersModal(false);
          setSelectedMemberForDetail(null);
        }
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
      }
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
      }
    });
  };

  const handleSendSOSFromCardClick = () => {
    if (!myLocation) {
      alert("GPS belum siap");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "🚨 DARURAT SOS",
      message: "Kirim sinyal bahaya sekarang? Semua nelayan dalam radius 50km akan diberitahu lokasi akurat Anda.",
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
      }
>>>>>>> Stashed changes
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
      className="relative h-screen w-screen overflow-hidden select-none bg-slate-900"
      style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
    >
      {/* PETA Z-0 */}
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
          selectedMemberId={selectedMemberForDetail?.userId || null}
          onSelectMember={handleMapMemberSelect}
        />
      </div>

<<<<<<< Updated upstream
      {/* TOP BAR */}
      <div className="absolute top-0 right-0 left-0 z-[1010] px-3 pt-3 pb-2">
=======
      {/* HEADER Z-10 */}
      <div className="absolute top-0 right-0 left-0 z-10 px-3 pt-3 pb-2">
>>>>>>> Stashed changes
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/60 bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <Image className="h-8 w-8" src={"/icon.svg"} width={100} height={100} alt="icon" />
            <div className="min-w-0 flex-1">
              <div className="mt-0.5 flex items-center gap-1">
                {gpsActive ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-600">GPS Terhubung</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    <span className="text-[9px] font-bold text-amber-600">Menunggu GPS…</span>
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
              className="flex h-[52px] items-center gap-1.5 rounded-2xl border border-white/60 bg-white/90 px-3 shadow-lg backdrop-blur-md relative z-10"
            >
              <span className="text-base">{activeFish.emoji}</span>
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showFishDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl z-20">
                {FISH_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setFishType(f.value);
                      setShowFishDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                      fishType === f.value ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
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

<<<<<<< Updated upstream
      {/* LAYER SWITCHER */}
      <div className="absolute top-1/2 right-3 z-[1010] flex -translate-y-1/2 flex-col gap-2">
        {LAYER_OPTIONS.map((layer) => (
          <button
            key={layer.value}
            onClick={() => setViewMode(layer.value)}
            title={layer.label}
=======
      {showFishDropdown && (
        <div className="absolute inset-0 z-20" onClick={() => setShowFishDropdown(false)} />
      )}

      {/* SOS BANNER Z-40 */}
      {sosAlert && (
        <div className="absolute top-20 right-4 left-4 z-40 rounded-2xl border border-red-200 bg-red-500 p-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🆘</span>
            <div className="flex-1">
              <p className="text-[13px] font-black text-white">Sinyal SOS Diterima!</p>
              <p className="text-[11px] font-medium text-red-100">
                Nelayan butuh bantuan di koordinat {sosAlert.latitude.toFixed(4)}, {sosAlert.longitude.toFixed(4)}
              </p>
            </div>
            <button onClick={() => setSOSAlert(null)} className="text-red-200"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* TOOLBAR KANAN Z-10 */}
      <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2">
        {LAYER_OPTIONS.map((layer) => (
          <button
            key={layer.value}
            onClick={() => layer.value === "pesan" ? setShowFamilyModal(true) : setViewMode(layer.value)}
>>>>>>> Stashed changes
            className={`flex h-11 w-11 flex-col items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
              viewMode === layer.value
                ? "border-emerald-300 bg-emerald-500 text-white shadow-emerald-200"
                : "border-white/60 bg-white/90 text-slate-600"
            }`}
          >
            <span className="text-base leading-none">{layer.icon}</span>
<<<<<<< Updated upstream
            <span
              className={`mt-0.5 text-[8px] leading-none font-bold ${viewMode === layer.value ? "text-white/90" : "text-slate-400"}`}
            >
              {layer.label}
            </span>
=======
            <span className="mt-0.5 text-[8px] font-bold">{layer.label}</span>
>>>>>>> Stashed changes
          </button>
        ))}

        {/* RECENTER BUTTON */}
        <button
          onClick={handleRecenter}
          className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/90 shadow-lg backdrop-blur-md text-blue-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" fill="#3b82f6" stroke="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
          <span className="mt-0.5 text-[8px] font-bold">GPS</span>
        </button>
      </div>

<<<<<<< Updated upstream
      {/* BOTTOM SHEET */}
      <div className="absolute right-0 bottom-16 left-0 z-[1010]">
=======
      {/* FLOATING CARD DETAIL NELAYAN Z-30 */}
      {selectedMemberForDetail && (
        <div className="absolute top-24 left-4 right-4 z-30 max-w-sm sm:mx-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-full rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${selectedMemberForDetail.isSOS ? "bg-red-500 animate-ping" : "bg-blue-500"}`} />
                <h4 className="text-sm font-black text-slate-800">
                  {selectedMemberForDetail.userName ?? "Nelayan"}
                  {selectedMemberForDetail.isSOS && <span className="ml-1 text-xs text-red-600 font-extrabold">(DARURAT)</span>}
                </h4>
              </div>
              <button onClick={() => setSelectedMemberForDetail(null)} className="rounded-lg p-1 text-slate-400"><X size={16} /></button>
            </div>

            <div className="flex gap-2">
              {outgoingTargets.has(selectedMemberForDetail.userId) ? (
                <button
                  onClick={() => confirmUnshareFromUser(selectedMemberForDetail.userId, selectedMemberForDetail.userName ?? "Nelayan")}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600"
                >
                  Cabut Akses Lokasi
                </button>
              ) : (
                <button
                  onClick={() => confirmShareToUser(selectedMemberForDetail.userId, selectedMemberForDetail.userName ?? "Nelayan")}
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white"
                >
                  Bagikan Lokasiku
                </button>
              )}
              <button
                onClick={handleSendSOSFromCardClick}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-black text-white flex justify-center items-center gap-1"
              >
                <AlertTriangle size={14}/> SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOMBOL BAWAH KANAN Z-10 */}
      <div className={`absolute right-4 z-10 flex flex-col items-end gap-3 transition-all duration-300 ${sheetExpanded ? "bottom-[280px]" : "bottom-24"}`}>
        <button
          onClick={handleToggleSharingClick}
          className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-black shadow-lg transition-all active:scale-95 ${
            isSharing ? "bg-emerald-500 text-white shadow-emerald-200" : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          {isSharing ? <UserCheck size={14} /> : <Users size={14} />}
          {isSharing ? "Lobi Armada Aktif" : "Bagikan Lokasi"}
        </button>
        {session?.user && <SOSButton />}
      </div>

      {/* SHEET REKOMENDASI ZPPI Z-10 */}
      <div className="absolute right-0 bottom-4 left-0 z-10">
>>>>>>> Stashed changes
        {!sheetExpanded ? (
          <div className="mx-3">
            <button onClick={() => setSheetExpanded(true)} className="w-full overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3 px-4 py-3.5">
                {topSpot && (
                  <>
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: getScoreLabel(topSpot.value).color }}>
                      <span className="text-lg leading-none font-black">{topSpot.value}</span>
                      <span className="text-[8px] leading-none font-bold opacity-80">SKOR</span>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Rekomendasi Terbaik Hari Ini</p>
                      <p className="text-sm font-black text-slate-800">Spot Utama · Hemat {fuelSavingPercent}% Solar</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {userLocation ? `${distance.toFixed(1)} Km dari posisimu` : "Menunggu GPS…"}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Tap Detail</div>
                  </>
                )}
                {!topSpot && <p className="text-sm text-slate-400">{loading ? "Memuat data..." : "Tap untuk melihat rekomendasi"}</p>}
              </div>
            </button>
          </div>
        ) : (
          <div className="mx-3 overflow-hidden rounded-3xl border border-white/60 bg-white/97 shadow-2xl backdrop-blur-md h-[260px] flex flex-col">
            <button onClick={() => setSheetExpanded(false)} className="flex w-full flex-col items-center pt-2 pb-1 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </button>

            {selectedSpot ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 flex items-center justify-between border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md px-1.5 py-0.5 text-[9px] font-black text-white uppercase" style={{ backgroundColor: scoreInfo?.color }}>{scoreInfo?.label} ({selectedSpot.value})</span>
                    <span className="font-mono text-[10px] text-slate-400">{selectedSpot.lat.toFixed(4)}, {selectedSpot.lng.toFixed(4)}</span>
                  </div>
                  <button onClick={() => setSheetExpanded(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Tutup</button>
                </div>

                <div className="flex border-b border-slate-100 bg-white shrink-0">
                  <button 
                    onClick={() => setActiveTab("rute")} 
                    className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === "rute" ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Navigation size={12} /> Info Rute
                  </button>
                  <button 
                    onClick={() => setActiveTab("analisis")} 
                    className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === "analisis" ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
                  >
                    <BarChart3 size={12} /> Analisis Satelit
                  </button>
                  <button 
                    onClick={() => setActiveTab("top_spot")} 
                    className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === "top_spot" ? "border-emerald-500 text-emerald-600 bg-emerald-50/30" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
                  >
                    <Layers size={12} /> Spot Lain
                  </button>
                </div>

<<<<<<< Updated upstream
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
                            🌿 Klorofil-a ({selectedSpot.breakdown.chlorValue.toFixed(2)} mg/m³)
                          </span>
                          <span className="text-[11px] font-black text-emerald-600">
                            +{selectedSpot.breakdown.chlorCont} pts
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${selectedSpot.breakdown.chlorCont}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">
                            🌡️ Suhu Permukaan ({selectedSpot.breakdown.sstValue.toFixed(1)} °C)
                          </span>
                          <span className="text-[11px] font-black text-blue-600">
                            +{selectedSpot.breakdown.sstCont} pts
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-400"
                            style={{ width: `${selectedSpot.breakdown.sstCont}%` }}
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
                            style={{ width: `${selectedSpot.breakdown.tideCont}%` }}
                          />
                        </div>
=======
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  {activeTab === "rute" && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-slate-50 p-2 text-center">
                          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Jarak</p>
                          <p className="text-base font-black text-slate-800">{userLocation ? `${distance.toFixed(1)} Km` : "—"}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2 text-center">
                          <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Waktu Tempuh</p>
                          <p className="text-base font-black text-slate-800">{userLocation ? `${Math.round(distance * 3.2)} Mnt` : "—"}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-500 p-2 text-center text-white shadow-sm shadow-emerald-100">
                          <p className="text-[9px] font-bold tracking-wider text-emerald-100 uppercase">Hemat Solar</p>
                          <p className="text-base font-black">{userLocation ? `${fuelSavingPercent}%` : "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs">
                        <div><span className="text-slate-400 text-[10px]">Rute Normal:</span> <span className="font-bold text-red-500 line-through">{traditionalFuel} Liter</span></div>
                        <div className="text-slate-300">➔</div>
                        <div><span className="text-slate-400 text-[10px]">Rute ZPPI:</span> <span className="font-bold text-emerald-600">{zppiFuel} Liter</span></div>
>>>>>>> Stashed changes
                      </div>
                    </div>
                  )}

                  {activeTab === "analisis" && (
                    <div className="space-y-2.5 animate-in fade-in duration-150">
                      {selectedSpot.breakdown ? (
                        <div className="space-y-2">
                          <div>
                            <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>🌿 Klorofil-a ({selectedSpot.breakdown.chlorValue.toFixed(2)} mg/m³)</span>
                              <span className="font-bold text-emerald-600">+{selectedSpot.breakdown.chlorCont} pts</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${selectedSpot.breakdown.chlorCont}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>🌡️ Suhu Permukaan ({selectedSpot.breakdown.sstValue.toFixed(1)} °C)</span>
                              <span className="font-bold text-blue-600">+{selectedSpot.breakdown.sstCont} pts</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${selectedSpot.breakdown.sstCont}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="mb-0.5 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                              <span>🌊 Kontribusi Pasut Alami</span>
                              <span className="font-bold text-cyan-600">+{selectedSpot.breakdown.tideCont} pts</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${selectedSpot.breakdown.tideCont}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">Data kriteria satelit tidak tersedia.</p>
                      )}
                    </div>
                  )}

                  {activeTab === "top_spot" && (
                    <div className="flex gap-2 animate-in fade-in duration-150">
                      {topSpots.map((spot, i) => {
                        const isActive = selectedSpot?.lat === spot.lat && selectedSpot?.lng === spot.lng;
                        return (
                          <button 
                            key={i} 
                            onClick={() => setSelectedSpot(spot)} 
                            className={`flex flex-1 flex-col items-center rounded-xl border py-2.5 transition-all ${isActive ? "border-emerald-300 bg-emerald-50/50" : "border-slate-100 bg-white hover:bg-slate-50"}`}
                          >
                            <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Spot {String.fromCharCode(65 + i)}</span>
                            <span className="text-sm font-black mt-0.5" style={{ color: getScoreLabel(spot.value).color }}>{spot.value}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 text-center text-sm text-slate-400 py-8">Pilih titik pada peta</div>
            )}
          </div>
        )}
      </div>

      <Navbar />
      <FamilyContactModal isOpen={showFamilyModal} onClose={() => setShowFamilyModal(false)} />

<<<<<<< Updated upstream
      {showFishDropdown && (
        <div
          className="absolute inset-0 z-[1005]"
          onClick={() => setShowFishDropdown(false)}
        />
      )}

      {/* BACKDROP UNTUK LIST FLEET MODAL */}
      {showFleetModal && (
        <div 
          className="absolute inset-0 z-[1999] bg-slate-900/20 backdrop-blur-sm transition-all"
          onClick={() => setShowFleetModal(false)}
        />
      )}

      {/* ─── GLASSMORPHISM FLEET LIST PANEL (Tampil pas klik Bagikan Lokasi) ─── */}
      {showFleetModal && (
        <div className="absolute right-4 bottom-36 left-4 z-[2000] max-h-64 overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Kirim Koordinat Target
              </p>
              <h4 className="text-xs font-black text-slate-700">
                {selectedSpot ? `Spot Skor: ${selectedSpot.value}` : "Belum Pilih Spot"}
              </h4>
            </div>
            <button 
              onClick={() => setShowFleetModal(false)} 
              className="rounded-full bg-slate-100 p-1 text-slate-400 hover:bg-slate-200"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {fleetMembers.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-semibold text-slate-400">Tidak ada nelayan aktif di sekitar.</p>
              </div>
          ) : (
    fleetMembers.map((member) => {
      const isSelected = selectedMemberId === member.userId;

      return (
        <div 
          key={member.userId} 
          onClick={() => setSelectedMemberId(isSelected ? null : member.userId)}
          className={`flex items-center justify-between rounded-2xl border p-2.5 transition-all hover:bg-white cursor-pointer ${
            isSelected 
              ? "border-blue-500 bg-blue-50/40 shadow-sm" 
              : "border-slate-100 bg-white/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                {(member?.userName || "unknown").substring(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-700">{member.userName}</p>
              <p className="text-[9px] font-medium text-slate-400">
                {userLocation 
                  ? `${calculateDistance(userLocation.lat, userLocation.lng, member.latitude, member.longitude).toFixed(1)} Km` 
                  : "Lokasi tidak diketahui"}
              </p>
            </div>
          </div>

        <button
  onClick={(e) => {
    e.stopPropagation();
    handleShareSpotToFisher(member);
    setActiveSharedMemberId(member.userId); // Mengunci ID nelayan agar tali muncul
  }}
  disabled={!selectedSpot}
  className="flex h-7 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-[10px] font-black text-white shadow-sm shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
>
  <Send size={10} />
  Kirim
</button>
        </div>
      );
    })
  )}
</div>
</div>
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

{/* CONTROL BUTTONS (BOTTOM RIGHT) */}
<div className="absolute right-4 bottom-24 z-[1000] flex flex-col items-end gap-3">
{/* BUTTON UTAMA BAGIKAN LOKASI */}
<button
  onClick={() => {
    // 1. Pastikan status share tracker internal menyala dulu
    if (!isSharing) {
      void handleToggleSharing();
    }
    // 2. Buka / tutup modal list nelayan
    setShowFleetModal((prev) => !prev);
  }}
  className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-black shadow-lg transition-all active:scale-95 ${
    isSharing || showFleetModal
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
=======
      {/* 👑 MODAL DAFTAR NELAYAN AKTIF (LOBI DI TENGAH) Z-50 */}
      {showActiveUsersModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setShowActiveUsersModal(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-black text-slate-800">Lobi Nelayan Aktif</h4>
              <button onClick={() => setShowActiveUsersModal(false)} className="rounded-lg p-1 hover:bg-slate-100 transition"><X size={18} className="text-slate-400" /></button>
            </div>
            
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {activeUsersList.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Belum ada nelayan lain di Lobi.</p>
              ) : (
                activeUsersList.map((user) => {
                  const alreadyShared = outgoingTargets.has(user.id);
                  return (
                    <div key={user.id} className={`flex items-center justify-between rounded-2xl border p-3 transition-colors ${alreadyShared ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100"}`}>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{user.name}</p>
                        <p className={`text-[10px] ${alreadyShared ? "text-emerald-500 font-semibold" : "text-slate-400"}`}>
                          {alreadyShared ? "✓ Akses diberikan" : "Belum ada akses"}
                        </p>
                      </div>
                      
                      {/* 👑 TOMBOL CABUT AKSES / BAGIKAN */}
                      {alreadyShared ? (
                        <button
                          onClick={() => confirmUnshareFromUser(user.id, user.name)}
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
            <button onClick={() => setShowActiveUsersModal(false)} className="mt-5 w-full rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95">Tutup Lobi</button>
          </div>
        </div>
      )}

      {/* GLOBAL CONFIRMATION MODAL Z-60 */}
      {confirmDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl scale-in-95">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              {confirmDialog.type === "danger" && <AlertTriangle size={20} className="text-red-500" />}
              {confirmDialog.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{confirmDialog.message}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95">Batal</button>
              <button
                onClick={async () => {
                  await confirmDialog.action();
                  setConfirmDialog(null);
                }}
                className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-sm transition active:scale-95 ${
                  confirmDialog.type === "danger" ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
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
>>>>>>> Stashed changes
}