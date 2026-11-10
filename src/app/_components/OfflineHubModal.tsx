"use client";

import { useEffect, useState } from "react";
import {
  Download,
  HardDrive,
  Wifi,
  WifiOff,
  X,
  MapPin,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Navigation,
  Compass,
} from "lucide-react";
import {
  downloadOfflineFishingArea,
  getOfflineStorageMetrics,
  getCustomWaypoints,
  saveCustomWaypoint,
  deleteCustomWaypoint,
  clearOfflineMapTiles,
  type StorageMetrics,
  type LocalWaypoint,
} from "~/lib/offline-storage";
import { calculateDistanceKm } from "~/lib/maritime-safety";

interface OfflineHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: (val: boolean) => void;
  onSelectWaypoint?: (wp: LocalWaypoint) => void;
  onRefreshMapData?: () => void;
}

export default function OfflineHubModal({
  isOpen,
  onClose,
  userLat,
  userLng,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onSelectWaypoint,
  onRefreshMapData,
}: OfflineHubModalProps) {
  const [activeTab, setActiveTab] = useState<"cache" | "waypoints">("cache");
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<{
    percentage: number;
    step: string;
    completed: number;
    total: number;
  } | null>(null);

  const [waypoints, setWaypoints] = useState<LocalWaypoint[]>([]);
  const [newWpName, setNewWpName] = useState("");
  const [newWpNotes, setNewWpNotes] = useState("");
  const [showAddWp, setShowAddWp] = useState(false);

  const loadMetricsAndWaypoints = async () => {
    try {
      const [m, wp] = await Promise.all([
        getOfflineStorageMetrics(),
        getCustomWaypoints(),
      ]);
      setMetrics(m);
      setWaypoints(wp);
    } catch (err) {
      console.warn("Gagal memuat metrik offline:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadMetricsAndWaypoints();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDownload = async () => {
    setDownloading(true);
    setProgress({ percentage: 0, step: "Menyiapkan unduhan...", completed: 0, total: 100 });

    const result = await downloadOfflineFishingArea((p) => {
      setProgress(p);
    });

    setDownloading(false);
    if (result.success) {
      await loadMetricsAndWaypoints();
      onRefreshMapData?.();
    } else {
      window.alert(result.error ?? "Gagal mengunduh peta offline");
    }
  };

  const handleClearCache = async () => {
    if (window.confirm("Hapus seluruh tile peta yang tersimpan di memori perangkat?")) {
      await clearOfflineMapTiles();
      await loadMetricsAndWaypoints();
    }
  };

  const handleAddWaypoint = async () => {
    const lat = userLat ?? -6.465;
    const lng = userLng ?? 108.452;

    await saveCustomWaypoint({
      name: newWpName.trim() || `Titik Tangkap #${waypoints.length + 1}`,
      lat,
      lng,
      notes: newWpNotes.trim() || undefined,
    });

    setNewWpName("");
    setNewWpNotes("");
    setShowAddWp(false);
    await loadMetricsAndWaypoints();
    onRefreshMapData?.();
  };

  const handleDeleteWaypoint = async (id: string) => {
    await deleteCustomWaypoint(id);
    await loadMetricsAndWaypoints();
    onRefreshMapData?.();
  };

  const formattedTileSize = metrics
    ? (metrics.tileSizeBytes / (1024 * 1024)).toFixed(1)
    : "0.0";

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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <HardDrive size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                Penyimpanan Peta & Koordinat
              </h3>
              <p className="text-[10px] text-slate-500 truncate">
                Akses Peta di Tengah Laut Tanpa Sinyal
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

        {/* Status Koneksi & Switch Simulasi */}
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            {isSimulatedOffline ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <WifiOff size={13} className="animate-pulse" />
                Mode Offline Aktif
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <Wifi size={13} />
                Online
              </span>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] text-slate-500 font-semibold">Simulasi Offline:</span>
            <input
              type="checkbox"
              checked={isSimulatedOffline}
              onChange={(e) => onToggleSimulatedOffline(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>

        {/* Segmented Control Tabs */}
        <div className="px-4 pt-2.5 pb-1.5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-center text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab("cache")}
              className={`rounded-lg py-1.5 text-[11px] transition-all ${
                activeTab === "cache"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              <Download size={13} className="inline mr-1" />
              Paket Peta Laut
            </button>
            <button
              onClick={() => setActiveTab("waypoints")}
              className={`rounded-lg py-1.5 text-[11px] transition-all ${
                activeTab === "waypoints"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              <Compass size={13} className="inline mr-1" />
              Titik Rahasia ({waypoints.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {activeTab === "cache" && (
            <div className="space-y-3">
              {/* Metrik Penyimpanan */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Tile Peta</p>
                  <p className="text-base font-bold text-slate-900">{metrics?.tileCount ?? 0}</p>
                  <p className="text-[9px] text-slate-500 font-mono">~{formattedTileSize} MB</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Titik ZPPI</p>
                  <p className="text-base font-bold text-emerald-600">{metrics?.zppiCount ?? 0}</p>
                  <p className="text-[9px] text-slate-500">4 Jenis Ikan</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Waypoint</p>
                  <p className="text-base font-bold text-amber-600">{metrics?.waypointCount ?? 0}</p>
                  <p className="text-[9px] text-slate-500">Tersimpan</p>
                </div>
              </div>

              {/* Progress Download */}
              {downloading && progress && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">{progress.step}</span>
                    <span className="font-mono font-bold text-emerald-700">{progress.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tombol Unduh */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-900">
                    Unduh Wilayah Perairan Melaut
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                    Menyimpan tile peta Pantura (Cirebon, Indramayu, Karangampel) serta titik koordinat satelit ke memori perangkat.
                  </p>
                </div>

                <button
                  onClick={handleStartDownload}
                  disabled={downloading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <RefreshCw size={13} className={downloading ? "animate-spin" : ""} />
                  <span>
                    {downloading
                      ? "Sedang Mengunduh..."
                      : metrics && metrics.tileCount > 0
                        ? "Perbarui Paket Peta Offline"
                        : "Unduh Paket Peta Sekarang (~3.8 MB)"}
                  </span>
                </button>
              </div>

              {metrics && metrics.tileCount > 0 && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleClearCache}
                    className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 size={11} /> Bersihkan Cache Peta
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "waypoints" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Spot Rahasia Nelayan
                </span>
                <button
                  onClick={() => setShowAddWp((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus size={13} /> {showAddWp ? "Batal" : "Tambah Spot"}
                </button>
              </div>

              {/* Form Tambah Spot */}
              {showAddWp && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Nama Spot (misal: Rumpon Karangampel)"
                    value={newWpName}
                    onChange={(e) => setNewWpName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Catatan (misal: Kedalaman 16m)"
                    value={newWpNotes}
                    onChange={(e) => setNewWpNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Koordinat:</span>
                    <span>{userLat ? `${userLat.toFixed(4)}, ${userLng?.toFixed(4)}` : "GPS Live"}</span>
                  </div>
                  <button
                    onClick={handleAddWaypoint}
                    className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95"
                  >
                    Simpan Titik Rahasia
                  </button>
                </div>
              )}

              {/* List Waypoint */}
              {waypoints.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-1">
                  <MapPin size={22} className="mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">Belum Ada Titik Rahasia</p>
                  <p className="text-[10px] text-slate-400">
                    Tandai koordinat rumpon atau batu karang favorit saat berlayar.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {waypoints.map((wp) => {
                    const dist =
                      userLat && userLng
                        ? calculateDistanceKm(userLat, userLng, wp.lat, wp.lng).toFixed(1)
                        : null;

                    return (
                      <div
                        key={wp.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 hover:border-slate-300"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-slate-800 truncate">
                            📍 {wp.name}
                          </h5>
                          <p className="text-[10px] font-mono text-slate-400">
                            {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                            {dist && ` • ~${dist} km`}
                          </p>
                          {wp.notes && (
                            <p className="text-[10px] italic text-slate-500 truncate">
                              "{wp.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {onSelectWaypoint && (
                            <button
                              onClick={() => {
                                onSelectWaypoint(wp);
                                onClose();
                              }}
                              title="Tampilkan di Peta"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              <Navigation size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteWaypoint(wp.id)}
                            title="Hapus"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-400">
          Data tersimpan aman di IndexedDB memori perangkat
        </div>
      </div>
    </div>
  );
}
