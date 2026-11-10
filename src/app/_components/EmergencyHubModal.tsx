"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Radio,
  Phone,
  MessageSquare,
  Navigation,
  X,
  Send,
  Users,
  Compass,
  CheckCircle2,
  Shield,
  LifeBuoy,
} from "lucide-react";
import type {
  EmergencyCategory,
  DetailedEmergencyReport,
} from "~/types/sos";
import {
  EMERGENCY_CATEGORIES,
  getSortedMaritimePosko,
  calculateDistanceKm,
  kmToNauticalMiles,
  estimateRescueTimeMinutes,
  calculateBearing,
} from "~/lib/maritime-safety";
import {
  sendDetailedEmergencyAction,
  getActiveEmergenciesAction,
  respondToEmergencyAction,
  resolveEmergencyAction,
} from "~/lib/actions/emergency";
import { queueEmergencyOffline } from "~/lib/offline-storage";

interface EmergencyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
  userName?: string;
  isSimulatedOffline?: boolean;
  onFocusSOSOnMap?: (targetLat: number, targetLng: number, victimName: string) => void;
}

export default function EmergencyHubModal({
  isOpen,
  onClose,
  userLat = -6.465,
  userLng = 108.452,
  userName = "Nelayan",
  isSimulatedOffline = false,
  onFocusSOSOnMap,
}: EmergencyHubModalProps) {
  const [activeTab, setActiveTab] = useState<"report" | "radar" | "posko">("report");

  // State Pelaporan
  const [selectedCategory, setSelectedCategory] =
    useState<EmergencyCategory>("ENGINE_FAILURE");
  const [crewCount, setCrewCount] = useState<number>(3);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);
  const [lastDispatchInfo, setLastDispatchInfo] = useState<{
    dispatchMessage: string;
    vhfScript: string;
    poskoPhone: string;
    poskoWa: string;
    poskoName: string;
  } | null>(null);

  // State Radar Komunitas
  const [communityAlerts, setCommunityAlerts] = useState<
    DetailedEmergencyReport[]
  >([]);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Posko Terdekat terurut berdasarkan jarak GPS
  const sortedPosko = useMemo(() => {
    return getSortedMaritimePosko(userLat, userLng);
  }, [userLat, userLng]);

  const nearestPosko = sortedPosko[0]!;

  const fetchRadarData = async () => {
    setLoadingRadar(true);
    const res = await getActiveEmergenciesAction();
    if (res.success) {
      setCommunityAlerts(res.data);
    }
    setLoadingRadar(false);
  };

  useEffect(() => {
    if (isOpen) {
      void fetchRadarData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategoryObj = EMERGENCY_CATEGORIES.find(
    (c) => c.id === selectedCategory,
  )!;

  const handleSendEmergency = async () => {
    setSubmitting(true);

    if (isSimulatedOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
      await queueEmergencyOffline({
        category: selectedCategory,
        categoryLabel: currentCategoryObj.label,
        latitude: userLat,
        longitude: userLng,
        crewCount,
        message: additionalNotes,
      });

      setSubmitting(false);
      setReportSuccess(true);
      setLastDispatchInfo({
        dispatchMessage: `[DARURAT MARITIM] Kapal ${userName} mengalami ${currentCategoryObj.label} di koordinat ${userLat.toFixed(5)}, ${userLng.toFixed(5)}. POB: ${crewCount} orang. Butuh bantuan segera!`,
        vhfScript: `MAYDAY MAYDAY MAYDAY, DI SINI KAPAL ${userName.toUpperCase()} DI ${userLat.toFixed(4)}, ${userLng.toFixed(4)}. BUTUH BANTUAN SEGERA.`,
        poskoPhone: nearestPosko.phone,
        poskoWa: nearestPosko.whatsapp,
        poskoName: nearestPosko.name,
      });
      return;
    }

    const res = await sendDetailedEmergencyAction({
      latitude: userLat,
      longitude: userLng,
      category: selectedCategory,
      categoryLabel: currentCategoryObj.label,
      crewCount,
      message: additionalNotes,
      contactPhone,
      targetPoskoId: nearestPosko.id,
    });

    setSubmitting(false);

    if (res.success) {
      setReportSuccess(true);
      setLastDispatchInfo({
        dispatchMessage: res.data.dispatchMessage,
        vhfScript: res.data.vhfScript,
        poskoPhone: res.data.nearestPosko.phone,
        poskoWa: res.data.nearestPosko.whatsapp,
        poskoName: res.data.nearestPosko.name,
      });
      void fetchRadarData();
    } else {
      window.alert(res.error ?? "Gagal menyiarkan sinyal darurat");
    }
  };

  const handleRespond = async (targetAlert: DetailedEmergencyReport) => {
    setRespondingId(targetAlert.id);
    const res = await respondToEmergencyAction(targetAlert.id);
    setRespondingId(null);
    if (res.success) {
      window.alert(
        `Anda telah terdaftar membantu ${targetAlert.userName}. Garis rute SAR sedang diarahkan di peta.`,
      );
      onFocusSOSOnMap?.(
        targetAlert.latitude,
        targetAlert.longitude,
        targetAlert.userName,
      );
      onClose();
    }
  };

  const handleResolveMyEmergency = async () => {
    if (window.confirm("Apakah kondisi darurat Anda sudah teratasi dan kapal sudah aman?")) {
      await resolveEmergencyAction();
      setReportSuccess(false);
      setLastDispatchInfo(null);
      void fetchRadarData();
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-150">
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white text-slate-800 shadow-2xl ring-1 ring-slate-900/10 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Handle */}
        <div className="flex w-full justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Header Modal */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <LifeBuoy size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                Pusat Keselamatan & Darurat Laut
              </h3>
              <p className="text-[10px] text-slate-500 truncate">
                Terhubung Nelayan & Posko SAR Terdekat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* GPS Live & Posko Info Bar */}
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-[10px] border-b border-slate-100 text-slate-600">
          <div className="flex items-center gap-1 font-mono">
            <Compass size={12} className="text-rose-500" />
            <span>GPS: {userLat.toFixed(4)}, {userLng.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Shield size={12} className="text-emerald-600" />
            <span>{nearestPosko.name.split(" ")[0]} ~{nearestPosko.distanceKm} km</span>
          </div>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-4 pt-2.5 pb-1.5">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-center text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab("report")}
              className={`rounded-lg py-1.5 text-[11px] transition-all ${
                activeTab === "report"
                  ? "bg-white text-rose-600 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Lapor SOS
            </button>
            <button
              onClick={() => {
                setActiveTab("radar");
                void fetchRadarData();
              }}
              className={`rounded-lg py-1.5 text-[11px] transition-all ${
                activeTab === "radar"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Radar ({communityAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab("posko")}
              className={`rounded-lg py-1.5 text-[11px] transition-all ${
                activeTab === "posko"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Posko SAR
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3.5">
          {/* TAB 1: LAPOR DARURAT */}
          {activeTab === "report" && (
            <div className="space-y-3">
              {reportSuccess && lastDispatchInfo ? (
                /* Sukses Disiarkan */
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle size={18} className="animate-pulse" />
                    <h4 className="text-xs font-bold uppercase">
                      Sinyal Darurat Telah Disiarkan
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Koordinat kapal Anda telah terkirim ke seluruh nelayan radius 50km dan posko{" "}
                    <strong>{lastDispatchInfo.poskoName}</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={`https://wa.me/${lastDispatchInfo.poskoWa}?text=${encodeURIComponent(
                        lastDispatchInfo.dispatchMessage,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-200"
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <span>WhatsApp Posko</span>
                    </a>

                    <a
                      href={`tel:${lastDispatchInfo.poskoPhone}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-200"
                    >
                      <Phone size={14} className="shrink-0" />
                      <span>Telp ({lastDispatchInfo.poskoPhone})</span>
                    </a>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-[10px] text-slate-600 font-mono space-y-0.5">
                    <p className="font-bold text-slate-800 font-sans">Radio VHF Marine Ch 16 (MAYDAY):</p>
                    <p className="text-slate-500 whitespace-pre-wrap">{lastDispatchInfo.vhfScript}</p>
                  </div>

                  <button
                    onClick={handleResolveMyEmergency}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95"
                  >
                    ✓ Saya Sudah Aman / Bantuan Tiba
                  </button>
                </div>
              ) : (
                /* Form Pelaporan */
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Pilih Jenis Kondisi Darurat:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EMERGENCY_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex flex-col items-start rounded-xl border p-2 text-left transition-all ${
                              isSelected
                                ? "border-rose-500 bg-rose-50 text-rose-950 font-bold"
                                : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700"
                            }`}
                          >
                            <span className="text-base">{cat.icon}</span>
                            <span className="mt-0.5 text-[11px] font-bold leading-tight">
                              {cat.label}
                            </span>
                            <span className="text-[9px] text-slate-500 leading-tight truncate w-full">
                              {cat.sublabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stepper Jumlah Awak (POB) */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/60 p-2.5">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Awak Kapal di Laut (POB):
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Jumlah orang yang perlu dievakuasi
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCrewCount((c) => Math.max(1, c - 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-bold text-slate-900">
                        {crewCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCrewCount((c) => c + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Catatan Tambahan */}
                  <div>
                    <input
                      type="text"
                      placeholder="Catatan tambahan (misal: butuh derek tali, baling-baling patah)"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Posko Target Info */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-[10px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Shield size={13} className="text-emerald-600" />
                      <span>Posko Tujuan: <strong>{nearestPosko.name}</strong></span>
                    </div>
                    <span className="font-mono text-slate-500">~{nearestPosko.distanceKm} km</span>
                  </div>

                  {/* Tombol Utama Kirim SOS */}
                  <button
                    onClick={handleSendEmergency}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Send size={14} />
                    {submitting
                      ? "Menyiarkan ke Armada..."
                      : isSimulatedOffline
                        ? "Simpan & Siapkan SMS Darurat (Offline)"
                        : "Siarkan Sinyal Darurat ke Armada & Posko"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RADAR KOMUNITAS */}
          {activeTab === "radar" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sinyal Aktif Nelayan
                </span>
                <button
                  onClick={fetchRadarData}
                  className="text-[10px] font-bold text-slate-600 hover:text-slate-900"
                >
                  Segarkan
                </button>
              </div>

              {loadingRadar ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p className="animate-pulse">Memindai radar maritim...</p>
                </div>
              ) : communityAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-1">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-slate-700">
                    Tidak Ada Laporan Darurat
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Seluruh armada di sekitar perairan terpantau aman.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {communityAlerts.map((alert) => {
                    const distKm = calculateDistanceKm(
                      userLat,
                      userLng,
                      alert.latitude,
                      alert.longitude,
                    );
                    const distNm = kmToNauticalMiles(distKm);
                    const etaMinutes = estimateRescueTimeMinutes(distKm);
                    const bearing = calculateBearing(
                      userLat,
                      userLng,
                      alert.latitude,
                      alert.longitude,
                    );

                    return (
                      <div
                        key={alert.id}
                        className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">
                                {alert.userName}
                              </h5>
                              <p className="text-[10px] font-bold text-rose-600 uppercase">
                                {alert.categoryLabel}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">
                            {alert.crewCount} Awak (POB)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-100">
                          <span>Jarak: <strong>{distKm.toFixed(1)} km</strong> ({distNm.toFixed(1)} NM)</span>
                          <span>Arah: <strong>{bearing.compassDir}</strong></span>
                          <span>ETA: <strong>~{etaMinutes} mnt</strong></span>
                        </div>

                        {alert.message && (
                          <p className="text-[10px] italic text-slate-600">
                            "{alert.message}"
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onFocusSOSOnMap?.(
                                alert.latitude,
                                alert.longitude,
                                alert.userName,
                              );
                              onClose();
                            }}
                            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-rose-600 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700 active:scale-95"
                          >
                            <Navigation size={12} /> Arahkan Rute SAR
                          </button>
                          <button
                            onClick={() => handleRespond(alert)}
                            disabled={respondingId === alert.id}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                          >
                            Bantu
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: POSKO SAR */}
          {activeTab === "posko" && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Posko Resmi Terdekat
              </span>

              {sortedPosko.map((posko, idx) => (
                <div
                  key={posko.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && (
                          <span className="rounded bg-emerald-100 px-1 py-0.2 text-[8px] font-bold text-emerald-800">
                            DEKAT
                          </span>
                        )}
                        <h5 className="text-xs font-bold text-slate-900">
                          {posko.name}
                        </h5>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        📻 {posko.radioChannel}
                      </p>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {posko.distanceKm} km
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${posko.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                      <Phone size={12} className="shrink-0 text-slate-500" />
                      <span>Telp Posko</span>
                    </a>

                    <a
                      href={`https://wa.me/${posko.whatsapp}?text=${encodeURIComponent(
                        `Halo ${posko.name}, saya nelayan ${userName} di koordinat ${userLat.toFixed(5)}, ${userLng.toFixed(5)}. Mohon koordinasi.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 shadow-sm"
                    >
                      <MessageSquare size={12} className="shrink-0 text-emerald-600" />
                      <span>Chat WA</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-[10px] text-slate-400">
          Siaga Radio VHF Marine Ch 16 & Basarnas Hotline 115
        </div>
      </div>
    </div>
  );
}
