"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Anchor, Trash2 } from "lucide-react";
import Navbar from "../_components/Navbar";
import {
  addCatchLogAction,
  getCatchLogsAction,
  deleteCatchLogAction,
} from "~/lib/actions/catch";
import { FISH_TYPES, LOCATIONS } from "~/lib/validators/catch";

interface CatchLog {
  id: string;
  fishType: string;
  weight: number;
  location: string;
  caughtAt: Date;
}

export default function HistoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catchLogs, setCatchLogs] = useState<CatchLog[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [fishType, setFishType] =
    useState<(typeof FISH_TYPES)[number]>("Tongkol");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(
    "Spot A (Karangampel)",
  );

  // ── Fetch logs on mount ─────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoadingFetch(true);
    const result = await getCatchLogsAction();
    if (result.success) {
      setCatchLogs(result.data);
    }
    setLoadingFetch(false);
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayLogs = catchLogs.filter(
    (l) => new Date(l.caughtAt).toDateString() === today,
  );
  const totalWeightToday = todayLogs.reduce((acc, l) => acc + l.weight, 0);

  // ── Add catch ───────────────────────────────────────────────────────────────
  const handleAddCatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoadingSubmit(true);

    const result = await addCatchLogAction({ fishType, weight, location });

    if (!result.success) {
      setErrorMsg(result.error);
      setLoadingSubmit(false);
      return;
    }

    setIsModalOpen(false);
    setWeight("");
    setLoadingSubmit(false);
    void fetchLogs();
  };

  // ── Delete catch ────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await deleteCatchLogAction(id);
    void fetchLogs();
  };

  return (
    <main className="relative min-h-screen w-screen bg-slate-50 pb-20 font-sans select-none">
      {/* HEADER */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Ringkasan Kerja
            </p>
            <h1 className="text-xl font-black tracking-tight text-slate-800">
              Histori Tangkapan
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95"
          >
            <Plus size={14} strokeWidth={3} />
            Tambah Data
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* TOTAL HIGHLIGHT CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-xl shadow-emerald-100">
          <div className="absolute right-[-10px] bottom-[-10px] text-white opacity-10">
            <Anchor size={140} />
          </div>
          <p className="text-xs font-bold tracking-widest text-emerald-100 uppercase">
            Total Tangkapan Hari Ini
          </p>
          <p className="mt-1 text-4xl font-black tracking-tight">
            {totalWeightToday.toFixed(1)}{" "}
            <span className="text-lg font-medium text-emerald-100">Kg</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/20 pt-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase">
                Total Trip
              </p>
              <p className="text-sm font-black">
                {todayLogs.length} Kali Labuh
              </p>
            </div>
            <div className="border-l border-white/20">
              <p className="text-[10px] font-bold text-emerald-100 uppercase">
                Efisiensi Rute
              </p>
              <p className="text-sm font-black">Sangat Baik</p>
            </div>
          </div>
        </div>

        {/* LOG LIST */}
        <div>
          <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Rincian Log Berkala
          </p>

          {loadingFetch ? (
            <div className="flex justify-center py-10">
              <svg
                className="h-6 w-6 animate-spin text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            </div>
          ) : catchLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <Anchor size={32} className="mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">
                Belum ada data tangkapan
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Tekan &quot;Tambah Data&quot; untuk mencatat
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {catchLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">
                        {log.fishType}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                        {new Date(log.caughtAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                      📍 {log.location}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-base font-black text-emerald-600">
                      +{log.weight} Kg
                    </p>
                    <button
                      onClick={() => void handleDelete(log.id)}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="animate-fade-in fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black tracking-tight text-slate-800">
                Catat Hasil Tangkapan
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => void handleAddCatch(e)}
              className="space-y-4 pt-4"
            >
              {errorMsg && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-500">
                  {errorMsg}
                </p>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Jenis Ikan
                </label>
                <select
                  value={fishType}
                  onChange={(e) =>
                    setFishType(e.target.value as (typeof FISH_TYPES)[number])
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  {FISH_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Berat Tangkapan (Kg)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Contoh: 45"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Lokasi Titik Koordinat
                </label>
                <select
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value as (typeof LOCATIONS)[number])
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingSubmit}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-600 disabled:opacity-60"
              >
                {loadingSubmit ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="white"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Tangkapan"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <Navbar />
    </main>
  );
}
