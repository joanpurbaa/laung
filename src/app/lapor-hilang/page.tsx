"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sheet,
  Search,
  User,
  Phone,
  Camera,
  Loader2,
  FileDown,
  TriangleAlert,
} from "lucide-react";
import WaveBackground from "../_components/WaveBackground";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_CATATAN = 1500;

type SubmitState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "success"; pdfUrl: string; filename: string };

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1000;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Fitur pemrosesan foto tidak tersedia di peramban ini.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal memproses foto."))),
      "image/jpeg",
      0.8,
    );
  });
  return blob;
}

export default function LaporHilangPage() {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [catatan, setCatatan] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>({ phase: "idle" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
  }, []);

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    WebkitTapHighlightColor: "transparent",
  };
  const inputClass =
    "w-full rounded-2xl px-5 py-4 text-[15px] font-semibold text-white placeholder:text-white/25 outline-none transition-all disabled:opacity-50";

  const validate = (): string | null => {
    if (!username.trim()) return "Username wajib diisi.";
    if (!code.trim()) return "Kode laporan wajib diisi.";
    if (code.replace(/[^A-Z0-9]/g, "").length !== 6)
      return "Kode laporan harus 6 karakter.";
    if (nama.trim().length < 2) return "Nama pelapor minimal 2 karakter.";
    const digits = hp.replace(/[^0-9]/g, "");
    if (digits.length < 9 || digits.length > 15)
      return "Nomor HP pelapor tidak valid.";
    if (catatan.length > MAX_CATATAN)
      return `Catatan maksimal ${MAX_CATATAN} karakter.`;
    return null;
  };

  const handleFotoChange = async (file: File | null) => {
    setFoto(null);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > MAX_PHOTO_BYTES
    ) {
      alert("Foto harus JPG/PNG/WEBP dan maksimal 5MB.");
      return;
    }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setUsername("");
    setCode("");
    setNama("");
    setHp("");
    setCatatan("");
    setFoto(null);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(null);
  };

  const handleSubmit = async () => {
    if (state.phase === "loading") return;
    const err = validate();
    if (err) {
      setState({ phase: "error", message: err });
      return;
    }

    setState({ phase: "loading" });
    try {
      let fotoBlob: Blob | null = null;
      if (foto) fotoBlob = await compressImage(foto);

      const form = new FormData();
      form.append("username", username.trim());
      form.append("code", code.replace(/[^A-Z0-9]/g, ""));
      form.append("reporterName", nama.trim());
      form.append("reporterPhone", hp.trim());
      form.append("keterangan", catatan.trim());
      if (fotoBlob) form.append("foto", fotoBlob, "foto.jpg");

      const res = await fetch("/api/lapor-hilang", { method: "POST", body: form });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setState({
          phase: "error",
          message:
            data?.error ??
            (res.status === 429
              ? "Terlalu banyak percobaan. Coba lagi nanti."
              : "Terjadi kesalahan, coba lagi."),
        });
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] ?? "laporan-hilang.pdf";

      const pdfUrl = URL.createObjectURL(blob);
      setState({ phase: "success", pdfUrl, filename });
      resetForm();
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = filename;
      a.click();
    } catch {
      setState({ phase: "error", message: "Koneksi bermasalah, coba lagi." });
    }
  };

  const isLoading = state.phase === "loading";
  const isError = state.phase === "error";
  const isSuccess = state.phase === "success";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
        background:
          "linear-gradient(175deg, #01212e 0%, #064e3b 45%, #065f46 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
      <WaveBackground />

      <div
        className="relative flex flex-1 flex-col overflow-y-auto px-7 pb-12"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        <div className="flex items-center gap-2.5 pt-16">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <Image src="/icon.svg" width={22} height={22} alt="Laung" />
          </div>
          <span
            className="text-[15px] font-black text-white/90"
            style={{ letterSpacing: "-0.02em" }}
          >
            Laung
          </span>
        </div>

        {isSuccess && state.phase === "success" ? (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/20 text-3xl">
              ✅
            </div>
            <h2 className="mt-4 text-xl font-black text-white">
              Laporan Terkirim
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed font-medium text-white/60">
              Laporan sudah dibuat. Unduh PDF dan bawa ke BASARNAS (115),
              Polairud (110), atau pos SAR terdekat.
            </p>
            <a
              href={state.pdfUrl}
              download={state.filename}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-[16px] text-[14px] font-black text-white"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                boxShadow: "0 8px 32px rgba(234,88,12,0.35)",
              }}
            >
              <FileDown className="h-4 w-4" />
              Unduh Laporan (PDF)
            </a>
            <button
              onClick={() => setState({ phase: "idle" })}
              className="mt-3 text-[12px] font-bold text-white/50"
            >
              Buat laporan lain
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-black tracking-[0.18em] text-amber-400/80 uppercase">
                Darurat &amp; Lapor Hilang
              </p>
              <h1
                className="text-[30px] leading-[1.05] font-black text-white"
                style={{ letterSpacing: "-0.04em" }}
              >
                Nelayan
                <br />
                Hilang di Laut
              </h1>
              <p className="mt-2.5 text-[13px] leading-relaxed font-medium text-white/60">
                Isi identitas &amp; kode laporan dari pesan WhatsApp Family View.
                PDF laporan bisa diunduh sebagai berkas resmi.
              </p>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl px-4 py-3.5"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <Sheet className="h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-[11px] leading-relaxed font-semibold text-amber-200/80">
                Username dan kode 6 huruf/angka ada di pesan WhatsApp yang
                dikirim otomatis dari aplikasi Family View.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {state.phase === "error" && (
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  <TriangleAlert className="h-4 w-4 shrink-0 text-red-300" />
                  <p className="text-[12px] font-normal text-red-300">
                    {state.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
                  Username Nelayan
                </label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="Contoh: JOKOSLAMET"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toUpperCase())
                    }
                    disabled={isLoading}
                    className={`${inputClass} pl-11 uppercase`}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.11)";
                      e.target.style.borderColor = "rgba(16,185,129,0.5)";
                    }}
                    onBlur={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.07)";
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
                  Kode Laporan (6 Karakter)
                </label>
                <input
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Contoh: JH3QX9"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  disabled={isLoading}
                  className={`${inputClass} text-center font-mono text-[20px] tracking-[0.35em]`}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.11)";
                    e.target.style.borderColor = "rgba(16,185,129,0.5)";
                  }}
                  onBlur={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.07)";
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
                  Nama Pelapor
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Nama kamu"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    disabled={isLoading}
                    className={`${inputClass} pl-11`}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.11)";
                      e.target.style.borderColor = "rgba(16,185,129,0.5)";
                    }}
                    onBlur={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.07)";
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
                  Nomor HP Pelapor
                </label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Contoh: 081234567890"
                    value={hp}
                    onChange={(e) =>
                      setHp(e.target.value.replace(/[^0-9+]/g, "").slice(0, 16))
                    }
                    disabled={isLoading}
                    className={`${inputClass} pl-11`}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.11)";
                      e.target.style.borderColor = "rgba(16,185,129,0.5)";
                    }}
                    onBlur={(e) => {
                      e.target.style.background = "rgba(255,255,255,0.07)";
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value.slice(0, MAX_CATATAN + 1))}
                  disabled={isLoading}
                  placeholder="Ceritakan kondisi terakhir, ciri kapal, waktu terakhir terlihat..."
                  rows={4}
                  className="w-full resize-none rounded-2xl px-5 py-4 text-[15px] font-semibold text-white placeholder:text-white/25 outline-none transition-all disabled:opacity-50"
                  style={inputStyle}
                />
                <p
                  className="text-right text-[10px] font-bold text-white/40"
                  style={{
                    color:
                      catatan.length > MAX_CATATAN ? "#f87171" : undefined,
                  }}
                >
                  {catatan.length}/{MAX_CATATAN}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
                  Foto (Opsional)
                </label>
                <label
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 py-6 transition-colors"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {fotoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fotoPreview}
                      alt="Pratinjau foto"
                      className="h-28 w-28 rounded-xl object-cover"
                    />
                  ) : (
                    <Camera className="h-6 w-6 text-white/40" />
                  )}
                  <span className="text-[12px] font-bold text-white/50">
                    {foto ? foto.name : "Pilih foto nelayan / kapal (JPG/PNG/WEBP, maks 5MB)"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={isLoading}
                    onChange={(e) =>
                      void handleFotoChange(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-[18px] text-[15px] font-black text-white transition-all active:scale-[0.97] disabled:opacity-60"
                style={{
                  background: isError
                    ? "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"
                    : "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  boxShadow: isError
                    ? "0 8px 32px rgba(234,88,12,0.4)"
                    : "0 8px 32px rgba(5,150,105,0.4)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat laporan...
                  </>
                ) : (
                  "Kirim Laporan"
                )}
              </button>

              <p className="mt-6 text-center text-[12px] leading-relaxed font-semibold text-white/50">
                Selalu hubungi{" "}
                <span className="font-black text-white/80">
                  BASARNAS 115
                </span>{" "}
                dan{" "}
                <span className="font-black text-white/80">Polairud 110</span>{" "}
                untuk penanganan darurat.
              </p>
              <p className="mt-2 text-center">
                <Link
                  href="/"
                  className="text-[12px] font-black text-white/60 underline"
                >
                  Kembali ke Beranda
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}