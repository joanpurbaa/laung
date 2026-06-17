"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar2 from "./_components/Navbar2";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function RevealFromRight({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView
          ? "translateX(0) scale(1) rotate(0deg)"
          : "translateX(60px) scale(0.92) rotate(2deg)",
        transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView(0.3);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 55;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) {
        setVal(to);
        clearInterval(timer);
      } else setVal(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {val.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

const STEPS = [
  {
    number: "01",
    eyebrow: "Buka Peta ZPPI",
    title: "Laut terbaca dari atas",
    body: "Data klorofil, suhu permukaan, dan arus pasang surut dari satelit NASA divisualisasikan langsung di peta. Titik hijau = ikan banyak.",
    detail: "Data NASA AQUA MODIS · resolusi 4km",
  },
  {
    number: "02",
    eyebrow: "Pilih Jenis Ikan",
    title: "Algoritma menyesuaikan targetmu",
    body: "Tongkol, tuna, kembung — setiap spesies punya preferensi suhu dan plankton berbeda. Sistem menyesuaikan scoring otomatis.",
    detail: "DSS weighted scoring · 3 parameter oseanografi",
  },
  {
    number: "03",
    eyebrow: "Berangkat Lebih Hemat",
    title: "Rute efisien, pulang lebih banyak",
    body: "GPS menghitung jarak dari posisimu ke spot terbaik. Lihat perbandingan konsumsi solar — selisihnya bisa 30–50 liter per trip.",
    detail: "Kalkulasi BBM otomatis · GPS real-time",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Dulu nebak-nebak. Sekarang langsung ke titiknya. Solar hemat, pulang lebih banyak ikan.",
    name: "Pak Slamet",
    role: "Nelayan, Karangampel · Cirebon",
    emoji: "🎣",
  },
  {
    quote:
      "Gak perlu banyar belajar. Buka, lihat warna hijau, berangkat. Sesederhana itu.",
    name: "Pak Wahyu",
    role: "Nelayan tradisional, Indramayu",
    emoji: "⛵",
  },
  {
    quote:
      "Yang saya suka ada info pasang surut juga. Jadi tahu kapan waktu terbaik keluar.",
    name: "Pak Darsono",
    role: "Ketua Kelompok Nelayan, Cirebon",
    emoji: "🐟",
  },
];

function WaterParticles() {
  const [particles, setParticles] = useState<
    {
      id: number;
      size: number;
      x: number;
      delay: number;
      duration: number;
      opacity: number;
    }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 3,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        opacity: 0.08 + Math.random() * 0.12,
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-emerald-500"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: "-10px",
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)   translateX(0);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-120vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeT, setActiveT] = useState(0);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(
      () => setActiveT((v) => (v + 1) % TESTIMONIALS.length),
      4200,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        fontFamily: "'DM Sans','Geist',sans-serif",
        background: "#fafaf8",
        color: "#1a1a1a",
      }}
    >
      <Navbar2 />
      <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-16 md:px-8 md:pt-24 md:pb-20">
        <WaterParticles />
        <div className="flex flex-col gap-12 md:flex-row md:items-center md:gap-16">
          <div
            className="flex-1"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(20px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[11px] font-black tracking-[0.1em] text-emerald-700 uppercase">
                Untuk Nelayan Indonesia
              </span>
            </div>

            <h1
              className="mb-5 text-[44px] leading-[1.0] font-black text-slate-900 md:text-[56px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Temukan spot
              <br />
              mancing terbaik
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg,#059669,#0d9488)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                pakai data satelit.
              </span>
            </h1>

            <p className="mb-8 max-w-md text-[16px] leading-relaxed font-medium text-slate-500">
              Laung membaca klorofil laut, suhu permukaan, dan pasang surut dari
              NASA — lalu tunjukkan persis di mana ikan berkumpul hari ini.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/register")}
                className="relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3.5 text-[15px] font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg,#059669,#0d9488)",
                  boxShadow: "0 6px 24px rgba(5,150,105,0.3)",
                }}
              >
                <span>
                  Install & Mulai Gratis
                  <span
                    className="absolute inset-0 translate-x-[-200%] -skew-x-12 animate-[shimmer_3s_ease_2s_infinite]"
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)",
                    }}
                  />
                  <style>{`@keyframes shimmer { to { transform: skewX(-12deg) translateX(400%); } }`}</style>
                </span>
              </button>
              <button
                onClick={() => router.push("/home")}
                className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-[14px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Lihat Demo Peta →
              </button>
            </div>

            <p className="mt-4 text-[12px] font-semibold text-slate-400">
              Gratis · Tanpa kartu kredit · Install langsung di HP
            </p>

            <div className="mt-10 flex items-center gap-6 border-t border-slate-100 pt-6">
              {[
                { v: 3, s: "", l: "Variabel satelit" },
                { v: 40, s: "%", l: "Hemat solar" },
                { v: 100, s: "+", l: "Spot terpetakan" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-[22px] font-black text-slate-900">
                    <Counter to={s.v} suffix={s.s} />
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex w-full flex-1 justify-center md:justify-end"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "none" : "translateY(20px) scale(0.97)",
              transition: "opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "min(480px, 90vw)",
                alignSelf: "flex-end",
                marginBottom: "-80px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: "10%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "60%",
                  height: "40%",
                  background:
                    "radial-gradient(ellipse, rgba(5,150,105,0.15) 0%, transparent 70%)",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              <Image
                className="relative z-10 hidden h-auto w-full sm:block"
                width={500}
                height={500}
                src="/maskot.png"
                alt="Maskot Laung"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="cara-kerja"
        className="border-t border-slate-100 bg-white py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-600 uppercase">
              Cara Kerja
            </p>
            <h2
              className="mb-12 text-[32px] leading-tight font-black text-slate-900 md:text-[40px]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Tiga langkah.
              <br />
              Pulang lebih banyak.
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-100/60">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-black text-emerald-500">
                      {step.number}
                    </span>
                    <span className="h-px flex-1 bg-emerald-100" />
                  </div>
                  <p className="mb-1 text-[11px] font-black tracking-[0.1em] text-emerald-600 uppercase">
                    {step.eyebrow}
                  </p>
                  <h3
                    className="mb-3 text-[20px] leading-tight font-black text-slate-900"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {step.title}
                  </h3>
                  <p className="flex-1 text-[14px] leading-relaxed font-medium text-slate-500">
                    {step.body}
                  </p>
                  <p className="mt-4 text-[11px] font-semibold text-emerald-500/70">
                    {step.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-t border-slate-100 bg-slate-50 pt-16 pb-10 md:pt-10">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex flex-col gap-12 md:flex-row md:items-end">
            <Reveal className="mb-10 flex-1">
              <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-600 uppercase">
                Install sebagai App
              </p>
              <h2
                className="mb-4 text-[32px] leading-tight font-black text-slate-900 md:text-[36px]"
                style={{ letterSpacing: "-0.03em" }}
              >
                Laung berjalan offline
                <br />
                di HP-mu.
              </h2>
              <p className="mb-8 max-w-md text-[15px] leading-relaxed font-medium text-slate-500">
                Tidak perlu App Store. Buka di browser → install → siap dipakai
                di tengah laut sekalipun tanpa sinyal.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Buka Laung di browser HP",
                  "Tap ikon berbagi di Safari / Chrome",
                  `Pilih "Tambahkan ke Layar Utama"`,
                  "Laung siap dipakai seperti app asli",
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
                      {i + 1}
                    </div>
                    <span className="text-[14px] font-semibold text-slate-600">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/register")}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg,#059669,#0d9488)",
                  boxShadow: "0 6px 24px rgba(5,150,105,0.25)",
                }}
              >
                Daftar & Install Sekarang
              </button>
            </Reveal>

            <RevealFromRight
              delay={150}
              className="flex flex-1 justify-center md:justify-end"
            >
              <div
                style={{
                  position: "relative",
                  width: "min(520px, 95vw)",
                  alignSelf: "flex-end",
                  marginBottom: "-80px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "-30px",
                    background:
                      "radial-gradient(ellipse at 55% 45%, rgba(5,150,105,0.18) 0%, transparent 65%)",
                    filter: "blur(32px)",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                />
                <Image
                  className="relative block h-auto w-full"
                  src="/mockup.png"
                  alt="Laung app di HP"
                  width={1500}
                  height={1500}
                />
              </div>
            </RevealFromRight>
          </div>
        </div>
      </section>

      {/* <section className="border-t border-slate-100 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-600 uppercase">
              Kata Nelayan
            </p>
            <h2
              className="mb-10 text-[32px] leading-tight font-black text-slate-900"
              style={{ letterSpacing: "-0.03em" }}
            >
              Sudah dipakai di Laut Jawa.
            </h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className={`group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${i === activeT ? "border-emerald-200 bg-emerald-50 shadow-sm shadow-emerald-100" : "border-slate-100 bg-slate-50"}`}
                >
                  <span className="mb-3 block text-2xl">{t.emoji}</span>
                  <p className="mb-4 text-[15px] leading-relaxed font-semibold text-slate-700">
                    &quot;{t.quote}&quot;
                  </p>
                  <p className="text-[13px] font-black text-slate-600">
                    {t.name}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {t.role}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section> */}

      <section
        className="border-t border-slate-100 py-16 md:py-20"
        style={{ background: "linear-gradient(135deg,#022c22,#065f46)" }}
      >
        <div className="mx-auto max-w-2xl px-5 text-center md:px-8">
          <Reveal>
            <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-400/70 uppercase">
              Mulai Sekarang
            </p>
            <h2
              className="mb-3 text-[36px] leading-tight font-black text-white md:text-[42px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Spot pertamamu
              <br />
              sudah menunggu.
            </h2>
            <p className="mb-8 text-[15px] font-medium text-white/50">
              Siap dalam 2 menit. Gratis untuk fitur dasar.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push("/register")}
                className="rounded-2xl bg-white px-8 py-3.5 text-[15px] font-black text-emerald-800 transition-all hover:bg-emerald-50 active:scale-[0.97]"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
              >
                Daftar Gratis
              </button>
              <button
                onClick={() => router.push("/home")}
                className="rounded-2xl border border-white/20 px-8 py-3.5 text-[14px] font-bold text-white/60 transition-all hover:border-white/40 hover:text-white/80"
              >
                Coba tanpa akun →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-12 text-center">
        <div className="flex justify-center gap-6 text-[13px] font-bold text-slate-400">
          <Link href="/terms" className="hover:text-emerald-600">
            Syarat & Ketentuan
          </Link>
          <Link href="/privacy" className="hover:text-emerald-600">
            Kebijakan Privasi
          </Link>
          <Link href="/about" className="hover:text-emerald-600">
            Tentang Kami
          </Link>
        </div>
        <p className="mt-6 text-[12px] text-slate-400">
          © 2026 Laung · Dibuat dengan semangat untuk laut Indonesia.
        </p>
      </footer>
    </div>
  );
}
