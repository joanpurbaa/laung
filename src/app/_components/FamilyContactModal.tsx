"use client";

import { useState, useEffect } from "react";
import { Settings, Play, Square, X } from "lucide-react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const userName =
    session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Nelayan";

  const [nomorKeluarga, setNomorKeluarga] = useState("082227097005");
  const [pesan, setPesan] = useState(
    "aku baik baik aja ya sayang, nanti langsung pulang",
  );
  const [frekuensi, setFrekuensi] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [cityName, setCityName] = useState<string>("Lokasi GPS");

  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({ show: false, type: "info", message: "" });

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

  useEffect(() => {
    if (!userLat || !userLng) return;

    const fetchCity = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json&addressdetails=1`,
          { headers: { "User-Agent": "ZPPI-Fisherman-App" } },
        );
        const json = (await res.json()) as { address: Record<string, string> };
        const address = json.address;
        const raw =
          address.city ??
          address.regency ??
          address.county ??
          address.municipality ??
          "Lokasi GPS";
        const clean = raw.replace(/(Kabupaten|Kota|Regency)\s+/gi, "");
        setCityName(clean);
      } catch {
        setCityName("Lokasi GPS");
      }
    };

    void fetchCity();
  }, [userLat, userLng]);

  const buildMessage = () => {
    const now = new Date();
    const waktu = now.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

    const mapsLink =
      userLat && userLng
        ? `https://maps.google.com/?q=${userLat},${userLng}`
        : "Lokasi tidak tersedia";

    return (
      `${pesan}\n` +
      `~${userName}\n\n` +
      `Waktu: ${waktu} WIB\n` +
      `Lokasi terakhir: ${mapsLink} (${cityName})\n\n` +
      `Pesan ini dikirim secara otomatis oleh sistem Family View Laung.`
    );
  };

  const triggerNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

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
      triggerNotification(
        "info",
        "Otomatisasi tracking dihentikan. Anda bisa fokus menangkap ikan tanpa kirim pesan otomatis.",
      );
      return;
    }

    setLoading(true);
    try {
      const finalMessage = buildMessage();

      const data = new FormData();
      data.append("target", nomorKeluarga);
      data.append("message", finalMessage);
      data.append("countryCode", "62");
      data.append("delay", "2");

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        mode: "cors",
        headers: new Headers({
          Authorization: process.env.FONNTE_TOKEN ?? "HREeZZbcSo7854nairPN",
        }),
        body: data,
      });

      const res = (await response.json()) as {
        status: boolean;
        reason?: string;
      };

      if (res.status === true) {
        try {
          await fetch("/api/cron/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "start",
              target: nomorKeluarga,
              message: buildMessage(),
              frequencyPerHour: frekuensi,
            }),
          });
        } catch (cronErr) {
          console.error("Gagal mendaftarkan cron job:", cronErr);
        }

        setIsActive(true);
        localStorage.setItem("radar_tracking_active", "true");
        localStorage.setItem("radar_tracking_nomor", nomorKeluarga);
        localStorage.setItem("radar_tracking_pesan", pesan);
        localStorage.setItem("radar_tracking_frekuensi", String(frekuensi));

        triggerNotification(
          "success",
          `Otomatisasi aktif! Pesan pertama terkirim. Sistem akan mengirim pesan ${frekuensi}x setiap jam.`,
        );
        setTimeout(() => onClose(), 1500);
      } else {
        triggerNotification(
          "error",
          `Gagal mengaktifkan! Alasan: ${res.reason ?? "Perangkat terputus"}`,
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      triggerNotification("error", `Terjadi kesalahan koneksi: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const mapsLink =
    userLat && userLng
      ? `https://maps.google.com/?q=${userLat},${userLng}`
      : null;

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

          {mapsLink && (
            <div className="mt-2 mb-1 flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <span className="text-sm">📍</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-emerald-700">
                  {cityName}
                </p>
                <p className="truncate font-mono text-[9px] text-emerald-500">
                  {mapsLink}
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
                className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-60"
              />
              <p className="mt-1 text-[9px] text-slate-400">
                Nama pengirim ({userName}), waktu, dan lokasi akan ditambahkan
                otomatis.
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
    </>
  );
}
