"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  X,
  Anchor,
  Trash2,
  Camera,
  Fish,
  Upload,
  Loader2,
} from "lucide-react";
import Navbar from "../_components/Navbar";
import {
  addCatchLogAction,
  getCatchLogsAction,
  deleteCatchLogAction,
} from "~/lib/actions/catch";
import { FISH_TYPES, LOCATIONS } from "~/lib/validators/catch";
import type { CatchLog } from "@prisma/client";

interface IdentificationResult {
  namaLokal: string;
  namaIlmiah: string;
  deskripsi: string;
  nilaiEkonomi: string;
  caraMasak: string;
  statusDilindungi: boolean;
}

export default function HistoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIdentifyModalOpen, setIsIdentifyModalOpen] = useState(false);
  const [catchLogs, setCatchLogs] = useState<CatchLog[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingIdentify, setLoadingIdentify] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [identifyError, setIdentifyError] = useState("");
  const [identifyResult, setIdentifyResult] =
    useState<IdentificationResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fishType, setFishType] =
    useState<(typeof FISH_TYPES)[number]>("Tongkol");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>(
    "Spot A (Karangampel)",
  );

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

  const today = new Date().toDateString();
  const todayLogs = catchLogs.filter(
    (l) => new Date(l.caughtAt).toDateString() === today,
  );
  const totalWeightToday = todayLogs.reduce((acc, l) => acc + l.weight, 0);

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

  const handleDelete = async (id: string) => {
    await deleteCatchLogAction(id);
    void fetchLogs();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIdentifyResult(null);
    setIdentifyError("");
  };

  const handleIdentify = async () => {
    if (!selectedFile) return;
    setLoadingIdentify(true);
    setIdentifyError("");
    setIdentifyResult(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsDataURL(selectedFile);
      });

      const mimeType = selectedFile.type as
        | "image/jpeg"
        | "image/png"
        | "image/webp";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64,
                    },
                  },
                  {
                    text: `Kamu adalah asisten identifikasi hewan laut untuk nelayan Indonesia.
Identifikasi hewan/ikan/hasil tangkapan laut pada foto ini.

Balas HANYA dalam format JSON berikut, tanpa teks tambahan:
{
  "namaLokal": "nama umum dalam bahasa Indonesia",
  "namaIlmiah": "nama ilmiah (genus spesies)",
  "deskripsi": "deskripsi singkat 1-2 kalimat tentang ciri khas dan habitatnya",
  "nilaiEkonomi": "nilai/harga pasaran dan kegunaannya bagi nelayan",
  "caraMasak": "cara masak atau pengolahan yang umum di Indonesia",
  "statusDilindungi": false
}

Jika foto bukan hewan laut atau tidak dapat diidentifikasi, isi namaLokal dengan "Tidak dapat diidentifikasi" dan field lainnya dengan string kosong, statusDilindungi tetap false.`,
                  },
                ],
              },
            ],
            generationConfig: {
              thinkingConfig: { thinkingBudget: 0 },
              temperature: 0.2,
              maxOutputTokens: 1024,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as IdentificationResult;
      setIdentifyResult(parsed);
    } catch (err) {
      setIdentifyError("Gagal mengidentifikasi. Coba foto yang lebih jelas.");
    } finally {
      setLoadingIdentify(false);
    }
  };

  const resetIdentifyModal = () => {
    setIsIdentifyModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIdentifyResult(null);
    setIdentifyError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} />
              Tambah Data
            </button>
          </div>
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
                  <div className="flex shrink-0 items-center gap-2">
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

      {/* MODAL TAMBAH TANGKAPAN */}
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

      {/* MODAL IDENTIFIKASI */}
      {isIdentifyModalOpen && (
        <div className="animate-fade-in fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-6 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                  <Fish
                    size={16}
                    className="text-emerald-600"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-slate-800">
                    Identifikasi Tangkapan
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Foto → AI kenali jenis ikan/hewan laut
                  </p>
                </div>
              </div>
              <button
                onClick={resetIdentifyModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Upload Area */}
              {!previewUrl ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Upload size={20} className="text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600">
                      Upload atau ambil foto
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      JPG, PNG, WEBP — maks. 10MB
                    </p>
                  </div>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={previewUrl}
                    alt="Preview tangkapan"
                    className="h-52 w-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setIdentifyResult(null);
                      setIdentifyError("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-sm"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                capture="environment"
              />

              {/* Error */}
              {identifyError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-500">
                  {identifyError}
                </p>
              )}

              {/* Hasil Identifikasi */}
              {identifyResult && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-black text-slate-800">
                          {identifyResult.namaLokal}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 italic">
                          {identifyResult.namaIlmiah}
                        </p>
                      </div>
                      {identifyResult.statusDilindungi && (
                        <span className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-500 uppercase">
                          Dilindungi
                        </span>
                      )}
                    </div>

                    {identifyResult.namaLokal !==
                      "Tidak dapat diidentifikasi" && (
                      <div className="mt-3 space-y-2.5 border-t border-slate-50 pt-3">
                        {identifyResult.deskripsi && (
                          <div>
                            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                              Deskripsi
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                              {identifyResult.deskripsi}
                            </p>
                          </div>
                        )}
                        {identifyResult.nilaiEkonomi && (
                          <div>
                            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                              Nilai Ekonomi
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                              {identifyResult.nilaiEkonomi}
                            </p>
                          </div>
                        )}
                        {identifyResult.caraMasak && (
                          <div>
                            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                              Cara Masak / Olahan
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                              {identifyResult.caraMasak}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setIdentifyResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <Camera size={13} />
                    Foto Lain
                  </button>
                </div>
              )}

              {/* Tombol Identifikasi */}
              {!identifyResult && (
                <button
                  onClick={() => void handleIdentify()}
                  disabled={!selectedFile || loadingIdentify}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                >
                  {loadingIdentify ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Mengidentifikasi...
                    </>
                  ) : (
                    <>
                      <Fish size={14} />
                      Identifikasi Sekarang
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB IDENTIFIKASI */}
      <button
        onClick={() => setIsIdentifyModalOpen(true)}
        className="fixed right-5 bottom-24 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-90"
        aria-label="Identifikasi tangkapan"
      >
        <Camera size={22} strokeWidth={2} className="text-white" />
      </button>

      <Navbar />
    </main>
  );
}
