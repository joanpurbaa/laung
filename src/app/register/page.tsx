"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import WaveBackground from "../_components/WaveBackground";

type FormState = "idle" | "loading" | "error" | "success";

function StrengthBar({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) =>
    r.test(password),
  ).length;
  const labels = ["", "Lemah", "Cukup", "Kuat", "Mantap 💪"];
  const colors = ["transparent", "#ef4444", "#f59e0b", "#10b981", "#059669"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                i <= score ? colors[score] : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
      <p className="text-[11px] font-bold" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
  }, []);

  const validate = () => {
    if (!name.trim() || name.trim().length < 2)
      return "Nama lengkap wajib diisi.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Format email tidak valid.";
    if (!password || password.length < 8)
      return "Kata sandi minimal 8 karakter.";
    if (!agreed) return "Kamu perlu setujui syarat penggunaan.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setErrorMsg(err);
      setState("error");
      return;
    }
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? "Pendaftaran gagal");
      }
      setState("success");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
      setState("error");
    }
  };

  const isLoading = state === "loading";
  const isSuccess = state === "success";

  const inputStyle = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    WebkitTapHighlightColor: "transparent",
  };
  const inputClass =
    "w-full rounded-2xl px-5 py-4 text-[15px] font-semibold text-white placeholder:text-white/20 outline-none transition-all disabled:opacity-50";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
        background:
          "linear-gradient(175deg, #011a12 0%, #022c22 40%, #065f46 100%)",
      }}
    >
      {/* Noise */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: "320px",
          height: "280px",
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Wave animation */}
      <WaveBackground />

      <div
        className="relative flex flex-1 flex-col overflow-y-auto px-7 pb-12"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Top nav */}
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

        {/* Hero text */}
        <div className="mt-10">
          <p className="mb-2 text-[11px] font-black tracking-[0.18em] text-emerald-400/80 uppercase">
            Bergabung Sekarang
          </p>
          <h1
            className="text-[38px] leading-[1.05] font-black text-white"
            style={{ letterSpacing: "-0.04em" }}
          >
            Daftar
            <br />
            Nelayan
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed font-medium text-white/50">
            Gratis. Simpan histori spot & tangkapanmu.
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 flex flex-col gap-4">
          {state === "error" && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <TriangleAlert className="h-4 w-4 shrink-0 text-red-300" />
              <p className="text-[12px] font-normal text-red-300">{errorMsg}</p>
            </div>
          )}
          {isSuccess && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{
                background: "rgba(5,150,105,0.15)",
                border: "1px solid rgba(5,150,105,0.3)",
              }}
            >
              <span className="text-sm">✅</span>
              <p className="text-[12px] font-semibold text-emerald-300">
                Akun dibuat! Mengalihkan...
              </p>
            </div>
          )}

          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
              Nama Lengkap
            </label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Pak Slamet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || isSuccess}
              className={inputClass}
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

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
              Email
            </label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="namakamu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isSuccess}
              className={inputClass}
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

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black tracking-[0.15em] text-white/40 uppercase">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
                disabled={isLoading || isSuccess}
                className={`${inputClass} pr-14`}
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
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                className="absolute top-1/2 right-4 -translate-y-1/2 p-1"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {showPass ? (
                  <svg
                    className="h-5 w-5 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Checkbox */}
          <button
            type="button"
            onClick={() => setAgreed((v) => !v)}
            disabled={isLoading || isSuccess}
            className="flex items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: agreed
                ? "rgba(5,150,105,0.1)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${agreed ? "rgba(5,150,105,0.35)" : "rgba(255,255,255,0.08)"}`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all"
              style={{
                border: `2px solid ${agreed ? "#059669" : "rgba(255,255,255,0.2)"}`,
                background: agreed ? "#059669" : "transparent",
              }}
            >
              {agreed && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <p className="text-[12px] leading-relaxed font-semibold text-white/40">
              Saya setuju dengan{" "}
              <span className="font-black text-emerald-400">
                Syarat Penggunaan
              </span>{" "}
              dan{" "}
              <span className="font-black text-emerald-400">
                Kebijakan Privasi
              </span>
            </p>
          </button>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <button
            onClick={() => void handleSubmit()}
            disabled={isLoading || isSuccess}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-[18px] text-[15px] font-black text-white transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              boxShadow: "0 8px 32px rgba(5,150,105,0.4)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isLoading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
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
                Mendaftarkan...
              </>
            ) : isSuccess ? (
              "✓ Berhasil!"
            ) : (
              <>
                Buat Akun Gratis
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>

          <p className="mt-6 text-center text-[13px] font-semibold text-white/60">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-black text-emerald-400">
              Masuk di Sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
