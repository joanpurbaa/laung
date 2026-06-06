"use client";

import { useState } from "react";
import {  Plus, X, Anchor } from "lucide-react";
import Navbar from "../_components/Navbar";

interface CatchLog {
  id: string;
  fishType: string;
  weight: number;
  location: string;
  time: string;
}

export default function HistoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catchLogs, setCatchLogs] = useState<CatchLog[]>([
]);

  // Form States
  const [fishType, setFishType] = useState("Tongkol");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("Spot A (Karangampel)");

  const totalWeightToday = catchLogs.reduce(
    (acc, curr) => acc + curr.weight,
    0,
  );

  const handleAddCatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    const newCatch: CatchLog = {
      id: Date.now().toString(),
      fishType,
      weight: parseFloat(weight),
      location,
      time:
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB",
    };

    setCatchLogs([newCatch, ...catchLogs]);
    setIsModalOpen(false);
    setWeight("");
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
            {totalWeightToday}{" "}
            <span className="text-lg font-medium text-emerald-100">Kg</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/20 pt-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase">
                Total Trip
              </p>
              <p className="text-sm font-black">
                {catchLogs.length} Kali Labuh
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
                      {log.time}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                    📍 {log.location}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-base font-black text-emerald-600">
                    +{log.weight} Kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POP-UP / MODAL INPUT TANGKAPAN */}
      {isModalOpen && (
        <div className="animate-fade-in fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black tracking-tight text-slate-800">
                Catat Hasil Tangkapan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCatch} className="space-y-4 pt-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Jenis Ikan
                </label>
                <select
                  value={fishType}
                  onChange={(e) => setFishType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Tongkol">🐟 Tongkol</option>
                  <option value="Tuna">🐠 Tuna</option>
                  <option value="Kembung">🐡 Kembung</option>
                  <option value="Tenggiri">🦈 Tenggiri</option>
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
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Spot A (Karangampel)">
                    Spot A (Karangampel)
                  </option>
                  <option value="Spot B (Utara Indramayu)">
                    Spot B (Utara Indramayu)
                  </option>
                  <option value="Spot C (Zona Luar)">Spot C (Zona Luar)</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-600"
              >
                Simpan Tangkapan
              </button>
            </form>
          </div>
        </div>
      )}

      <Navbar />
    </main>
  );
}
