"use client";

import { useState, useEffect } from "react";
import { Settings, Play, Square, X, KeyRound } from "lucide-react";
import {
  startFamilyViewAction,
  stopFamilyViewAction,
  getFamilyViewActiveAction,
  type FamilyViewSessionInfo,
} from "~/lib/actions/familyView";

interface FamilyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number | null;
  userLng?: number | null;
}

export default function FamilyContactModal({
  isOpen,
  onClose,
  userLat,
  userLng,
}: FamilyContactModalProps) {
  const [nomorKeluarga, setNomorKeluarga] = useState("");
  const [pesan, setPesan] = useState("");
  const [frekuensi, setFrekuensi] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [activeInfo, setActiveInfo] = useState<FamilyViewSessionInfo | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({ show: false, type: "info", message: "" });

  useEffect(() => {
    const savedNomor = localStorage.getItem("radar_tracking_nomor");
    const savedPesan = localStorage.getItem("radar_tracking_pesan");
    const savedFrekuensi = localStorage.getItem("radar_tracking_frekuensi");

    if (savedNomor) setNomorKeluarga(savedNomor);
    if (savedPesan) setPesan(savedPesan);
    if (savedFrekuensi) setFrekuensi(Number(savedFrekuensi));

    void (async () => {
      const result = await getFamilyViewActiveAction();
      if (result.success && result.active) {
        setIsActive(true);
        setActiveInfo(result.session);
        if (result.session.phone) setNomorKeluarga(result.session.phone);
        if (result.session.message) setPesan(result.session.message);
      }
    })();
  }, []);

  const triggerNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleToggleTracking = async () => {
    if (isActive) {
      const result = await stopFamilyViewAction();
      setIsActive(false);
      setActiveInfo(null);
      localStorage.setItem("radar_tracking_active", "false");
      triggerNotification(
        result.success ? "info" : "error",
        result.success
          ? "Family View dimatikan. Pesan otomatis tidak akan dikirim lagi."
          : result.error,
      );
      return;
    }

    setLoading(true);
    try {
      const result = await startFamilyViewAction({
        phone: nomorKeluarga,
        message: pesan,
        frequencyPerHour: frekuensi,
        latitude: userLat ?? null,
        longitude: userLng ?? null,
      });

      if (!result.success) {
        triggerNotification("error", result.error);
        return;
      }

      setIsActive(true);
      setActiveInfo(result.session);
      localStorage.setItem("radar_tracking_active", "true");
      localStorage.setItem("radar_tracking_nomor", nomorKeluarga);
      localStorage.setItem("radar_tracking_pesan", pesan);
      localStorage.setItem("radar_tracking_frekuensi", String(frekuensi));

      triggerNotification(
        "success",
        `Family View aktif! Kode laporan ${result.session.code} sudah terkirim ke WhatsApp keluarga.`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      triggerNotification("error", `Terjadi kesalahan koneksi: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeLink =
    activeInfo?.lat != null && activeInfo?.lng != null
      ? `https://maps.google.com/?q=${activeInfo.lat},${activeInfo.lng}`
      : null;
  const currentLink =
    !isActive && userLat && userLng
      ? `https://maps.google.com/?q=${userLat},${userLng}`
      : null;
  const shownLink = activeLink ?? currentLink;
  const shownArea = activeInfo?.area ?? "Lokasi GPS";

  return (
    <>
      {notification.show && (
        <div className="fixed top-28 left-1/2 z-[999999] flex w-full max-w-xs -translate-x-1/2 animate-bounce items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <span>
              {notification.type === "success" && "✅"}
              {notification.type === "error" && "❌"}
              {notification.type === "info" && "🛑"}
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {notification.message}
            </p>
          </div>
          <button
            onClick={() =>
              setNotification((prev) => ({ ...prev, show: false }))
            }
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-500" />
              <h3 className="text-base font-bold tracking-wide text-slate-800">
                Family View
              </h3>
            </div>
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
            )}
          </div>

          {isActive && activeInfo && (
            <div className="mt-3 mb-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <div className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                  Kode Laporan Hilang
                </p>
              </div>
              <p className="mt-1 font-mono text-2xl font-black tracking-[0.3em] text-emerald-700">
                {activeInfo.code}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed font-semibold text-emerald-600">
                Username:{" "}
                <span className="font-mono font-black">
                  {activeInfo.username || "-"}
                </span>
                . Jika tidak ada kabar, keluarga bisa melapor di halaman Lapor
                Hilang (menu Beranda) menggunakan kode ini.
              </p>
            </div>
          )}

          {shownLink && (
            <div className="mt-2 mb-1 flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <span className="text-sm">📍</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-emerald-700">
                  {shownArea}
                </p>
                <p className="truncate font-mono text-[9px] text-emerald-500">
                  {shownLink}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 mb-6 space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400">
                NOMOR WHATSAPP KELUARGA
              </label>
              <input
                type="text"
                disabled={isActive}
                value={nomorKeluarga}
                onChange={(e) => setNomorKeluarga(e.target.value)}
                placeholder="Contoh: 082227097005"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400">
                FREKUENSI PENGIRIMAN (PER JAM)
              </label>
              <select
                disabled={isActive}
                value={frekuensi}
                onChange={(e) => setFrekuensi(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-60"
              >
                <option value={1}>1 Kali per jam (Setiap 60 menit)</option>
                <option value={2}>2 Kali per jam (Setiap 30 menit)</option>
                <option value={3}>3 Kali per jam (Setiap 20 menit)</option>
                <option value={4}>4 Kali per jam (Setiap 15 menit)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400">
                PESAN KE KELUARGA
              </label>
              <textarea
                disabled={isActive}
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Contoh: aku baik baik aja ya sayang, nanti langsung pulang"
                maxLength={1500}
                className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-60"
              />
              <p className="mt-1 text-[9px] text-slate-400">
                Nama pengirim, waktu, dan lokasi akan ditambahkan otomatis.
                Pesan juga memuat kode laporan untuk aplikasi Lapor Hilang.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" />
              Tutup
            </button>

            <button
              onClick={() => void handleToggleTracking()}
              disabled={loading}
              type="button"
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                isActive
                  ? "bg-rose-500 shadow-rose-600/10 hover:bg-rose-600"
                  : "bg-emerald-500 shadow-emerald-600/10 hover:bg-emerald-600"
              }`}
            >
              {isActive ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-white" />
                  Matikan Auto
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  {loading ? "Proses..." : "Mulai Auto"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}