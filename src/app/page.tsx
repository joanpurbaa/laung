"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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

function MapMockup() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/20"
      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 font-mono text-[11px] text-slate-400">
          laung.app/home
        </div>
      </div>

      <div className="flex" style={{ height: "380px" }}>
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, #c8e6f0 0%, #a8d5e8 40%, #7ec8e0 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(0,100,160,0.08) 18px, rgba(0,100,160,0.08) 19px), repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,100,160,0.06) 18px, rgba(0,100,160,0.06) 19px)",
            }}
          />
          <div
            className="absolute right-0 bottom-0 left-0"
            style={{
              height: "32%",
              background: "linear-gradient(0deg, #8fba7a 0%, #a3c97a 100%)",
              borderRadius: "4px 4px 0 0",
            }}
          />
          <div
            className="absolute bottom-[31%] left-0"
            style={{
              width: "35%",
              height: "12%",
              background: "#a3c97a",
              borderRadius: "0 8px 0 0",
            }}
          />

          {[
            {
              top: "28%",
              left: "22%",
              size: 40,
              color: "#059669",
              opacity: 0.85,
              score: 92,
            },
            {
              top: "18%",
              left: "45%",
              size: 32,
              color: "#059669",
              opacity: 0.75,
              score: 87,
            },
            {
              top: "35%",
              left: "60%",
              size: 36,
              color: "#10b981",
              opacity: 0.7,
              score: 79,
            },
            {
              top: "22%",
              left: "72%",
              size: 28,
              color: "#f59e0b",
              opacity: 0.7,
              score: 63,
            },
            {
              top: "42%",
              left: "38%",
              size: 24,
              color: "#10b981",
              opacity: 0.65,
              score: 71,
            },
            {
              top: "15%",
              left: "82%",
              size: 22,
              color: "#ef4444",
              opacity: 0.6,
              score: 44,
            },
            {
              top: "30%",
              left: "82%",
              size: 26,
              color: "#f59e0b",
              opacity: 0.65,
              score: 58,
            },
          ].map((d, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center rounded-full"
              style={{
                top: d.top,
                left: d.left,
                width: d.size,
                height: d.size,
                background: d.color,
                opacity: d.opacity,
                transform: "translate(-50%,-50%)",
                boxShadow: `0 0 ${d.size * 0.8}px ${d.color}50`,
              }}
            >
              <span
                style={{
                  fontSize: d.size * 0.28,
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1,
                }}
              >
                {d.score}
              </span>
            </div>
          ))}

          <div
            className="absolute"
            style={{
              bottom: "34%",
              left: "18%",
              transform: "translate(-50%, 50%)",
            }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="h-4 w-4 animate-ping rounded-full bg-blue-500 opacity-40"
                style={{ position: "absolute" }}
              />
              <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
            </div>
          </div>

          <div className="absolute top-3 right-3 left-3 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">
                GPS Aktif
              </span>
              <div className="ml-auto flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-blue-600">LIVE</span>
              </div>
            </div>
            <div className="rounded-xl bg-white/90 px-2.5 py-2 shadow-sm backdrop-blur-sm">
              <span className="text-base">🐟</span>
            </div>
          </div>

          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 flex-col gap-1.5">
            {[
              { icon: "🚀", label: "ZPPI", active: true },
              { icon: "🌿", label: "Klor" },
              { icon: "🌡️", label: "SST" },
            ].map((l, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-xl px-2 py-1.5 shadow-sm ${l.active ? "bg-emerald-500 text-white" : "bg-white/90 text-slate-500"}`}
                style={{ minWidth: "40px" }}
              >
                <span className="text-sm leading-none">{l.icon}</span>
                <span
                  className={`mt-0.5 text-[7px] font-black ${l.active ? "text-white/80" : "text-slate-400"}`}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute right-3 bottom-[34%] flex flex-col gap-1 rounded-xl bg-white/90 p-2 shadow-sm backdrop-blur-sm">
            {[
              ["#059669", "Sangat Baik"],
              ["#10b981", "Baik"],
              ["#f59e0b", "Sedang"],
              ["#ef4444", "Rendah"],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: c }}
                />
                <span className="text-[8px] font-semibold text-slate-600">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute right-0 bottom-0 left-0 rounded-t-3xl bg-white shadow-2xl"
          style={{ height: "140px" }}
        >
          <div className="flex flex-col items-center pt-2.5">
            <div className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          <div className="px-4 pt-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                style={{ background: "#059669" }}
              >
                <span className="text-lg leading-none font-black">92</span>
                <span className="text-[7px] font-bold opacity-80">SKOR</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                  Rekomendasi Terbaik
                </p>
                <p className="text-[13px] font-black text-slate-800">
                  Spot A · Hemat 40% Solar
                </p>
                <p className="text-[10px] text-slate-400">
                  12.4 Km · 09:00–15:00 WIB
                </p>
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50 text-center">
              {[
                ["24", "Spot Aktif"],
                ["3", "Sangat Baik"],
                ["Pasang", "Kondisi Air"],
              ].map(([v, l]) => (
                <div key={l} className="py-1.5">
                  <p className="text-[11px] font-black text-slate-800">{v}</p>
                  <p className="text-[8px] text-slate-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icon.svg"
              width={26}
              height={26}
              alt="Laung"
              className="rounded-lg"
            />
            <span
              className="text-[16px] font-black text-slate-900"
              style={{ letterSpacing: "-0.03em" }}
            >
              Laung
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/#cara-kerja"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Cara Kerja
            </Link>
            <Link
              href="/about"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Privacy
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden text-[13px] font-bold text-slate-500 transition-colors hover:text-slate-800 md:block"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-xl px-4 py-2 text-[13px] font-black text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#059669,#0d9488)" }}
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

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
              {/* Ambient glow hijau di belakang maskot */}
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
                className="hidden sm:block w-full h-auto relative z-10"
                width={300}
                height={300}
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
                <img
                  src="/mockup.png"
                  alt="Laung app di HP"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    position: "relative",
                    zIndex: 1,
                    filter: "drop-shadow(0 32px 56px rgba(0,0,0,0.18))",
                  }}
                />
              </div>
            </RevealFromRight>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white py-16 md:py-20">
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
      </section>

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
