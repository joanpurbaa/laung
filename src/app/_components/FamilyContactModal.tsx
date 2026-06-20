"use client";

import { useState, useEffect } from "react";
import { Settings, Play, Square, X } from "lucide-react";

interface FamilyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FamilyContactModal({
  isOpen,
  onClose,
}: FamilyContactModalProps) {
  const [nomorKeluarga, setNomorKeluarga] = useState("082227097005");
  const [pesan, setPesan] = useState("Status Radar Tracking: Aman di laut.");
  const [frekuensi, setFrekuensi] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const savedActive = localStorage.getItem("radar_tracking_active");
    const savedNomor = localStorage.getItem("radar_tracking_nomor");
    const savedPesan = localStorage.getItem("radar_tracking_pesan");
    const savedFrekuensi = localStorage.getItem("radar_tracking_frekuensi");

    if (savedActive === "true") setIsActive(true);
    if (savedNomor) setNomorKeluarga(savedNomor);
    if (savedPesan) setPesan(savedPesan);
    if (savedFrekuensi) setFrekuensi(Number(savedFrekuensi));
  }, []);

  const handleToggleTracking = async () => {
    if (isActive) {
      try {
        await fetch("/api/cron/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop", target: nomorKeluarga }),
        });
      } catch (err) {
        console.error(err);
      }

      setIsActive(false);
      localStorage.setItem("radar_tracking_active", "false");
      alert(
        "🛑 Otomatisasi tracking dihentikan. Anda bisa fokus menangkap ikan tanpa kirim pesan otomatis.",
      );
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("target", nomorKeluarga);
    data.append(
      "message",
      `${pesan}\n\n(Pesan otomatis terjadwal: ${frekuensi}x per jam)`,
    );
    data.append("countryCode", "62");
    data.append("delay", "2");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      mode: "cors",
      headers: new Headers({
        Authorization: process.env.FONNTE_TOKEN,
      }),
      body: data,
    });

    const res = await response.json();

    if (res.status === true) {
      await fetch("/api/cron/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          target: nomorKeluarga,
          message: pesan,
          frequencyPerHour: frekuensi,
        }),
      });

      setIsActive(true);
      localStorage.setItem("radar_tracking_active", "true");
      localStorage.setItem("radar_tracking_nomor", nomorKeluarga);
      localStorage.setItem("radar_tracking_pesan", pesan);
      localStorage.setItem("radar_tracking_frekuensi", String(frekuensi));

      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            <h3 className="text-base font-bold tracking-wide text-slate-800">
              Otomatisasi Kontak Rumah
            </h3>
          </div>
          {isActive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          )}
        </div>

        <p className="mb-5 text-[11px] leading-relaxed text-slate-500">
          Atur pengiriman laporan otomatis agar Anda bisa fokus bekerja di laut
          tanpa perlu mengetik manual.
        </p>

        <div className="mb-6 space-y-4">
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
              TEMPLAT PESAN RADAR
            </label>
            <textarea
              disabled={isActive}
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-60"
            />
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
            onClick={handleToggleTracking}
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
  );
}
