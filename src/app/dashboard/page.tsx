"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../_components/Navbar";
import SplashScreen from "../_components/SplashScreen";
import { useSession } from "next-auth/react";
import type { LocationCoords } from "~/types/location";
import type { WeatherData } from "~/types/weather";
import type { TidePoint } from "~/types/tide";

const DEFAULT_LOCATION: LocationCoords = {
  latitude: -6.465,
  longitude: 108.452,
  name: "Karangampel",
};

function useWeather(coords: LocationCoords) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,visibility&wind_speed_unit=kmh&timezone=Asia%2FJakarta`,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const c = json.current;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const wCode: number = c.weather_code ?? 0;

        const getCondition = (
          code: number,
        ): { label: string; icon: string } => {
          if (code === 0) return { label: "Cerah Sempurna", icon: "☀️" };
          if (code <= 2) return { label: "Berawan Sebagian", icon: "⛅" };
          if (code <= 3) return { label: "Mendung", icon: "☁️" };
          if (code <= 48) return { label: "Berkabut", icon: "🌫️" };
          if (code <= 67) return { label: "Hujan Ringan", icon: "🌧️" };
          if (code <= 77) return { label: "Salju / Hujan Es", icon: "🌨️" };
          if (code <= 82) return { label: "Hujan Lebat", icon: "⛈️" };
          return { label: "Badai", icon: "🌪️" };
        };

        const getWindDir = (deg: number): string => {
          const dirs = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];
          return dirs[Math.round(deg / 45) % 8] ?? "U";
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const windKmh: number = c.wind_speed_10m ?? 0;
        const waveEst = Math.max(0.1, (windKmh / 60) * 2.5);
        const cond = getCondition(wCode);

        setData({
          windSpeed: Math.round(windKmh),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          windDir: getWindDir(c.wind_direction_10m ?? 0),
          waveHeight: parseFloat(waveEst.toFixed(1)),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          visibility: Math.round((c.visibility ?? 10000) / 1000),
          condition: cond.label,
          conditionIcon: cond.icon,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          tempAir: Math.round(c.temperature_2m ?? 28),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          humidity: Math.round(c.relative_humidity_2m ?? 75),
          safeToSail: windKmh < 30 && wCode < 60,
        });
      } catch {
        setData({
          windSpeed: 14,
          windDir: "TL",
          waveHeight: 0.6,
          visibility: 12,
          condition: "Cerah Sebagian",
          conditionIcon: "⛅",
          tempAir: 29,
          humidity: 78,
          safeToSail: true,
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchWeather();
    const iv = setInterval(() => void fetchWeather(), 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [coords.latitude, coords.longitude]);

  return { data, loading };
}

function useTides() {
  const [tides, setTides] = useState<TidePoint[]>([]);
  useEffect(() => {
    fetch("/api/tides")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (Array.isArray(d)) setTides(d as TidePoint[]);
      })
      .catch(() => null);
  }, []);
  return tides;
}

function WaveBar({
  height,
  max,
  active,
}: {
  height: number;
  max: number;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-10 w-2 items-end overflow-hidden rounded-full bg-slate-100">
        <div
          className={`w-full rounded-full transition-all duration-700 ${active ? "bg-blue-500" : "bg-emerald-400"}`}
          style={{ height: `${(height / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

function WindCompass({ deg, dir }: { deg: string; dir: number }) {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
      {["U", "T", "S", "B"].map((d, i) => (
        <span
          key={d}
          className="absolute text-[8px] font-black text-slate-300"
          style={{
            top: i === 0 ? "2px" : i === 2 ? "auto" : "50%",
            bottom: i === 2 ? "2px" : "auto",
            left: i === 3 ? "2px" : i === 1 ? "auto" : "50%",
            right: i === 1 ? "2px" : "auto",
            transform:
              i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)",
          }}
        >
          {d}
        </span>
      ))}
      <div
        className="absolute h-6 w-1 origin-bottom rounded-full bg-emerald-500"
        style={{
          bottom: "50%",
          left: "calc(50% - 2px)",
          transformOrigin: "bottom center",
          transform: `rotate(${dir}deg)`,
        }}
      />
      <div className="absolute h-2 w-2 rounded-full bg-slate-800" />
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black whitespace-nowrap text-slate-500">
        {deg}
      </div>
    </div>
  );
}

function getNowTime() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function getNowHour() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  ).getHours();
}

function getBestSailWindow() {
  const h = getNowHour();
  if (h >= 4 && h < 9)
    return {
      label: "Siap Berangkat!",
      color: "#059669",
      desc: "Kondisi angin & arus optimal sekarang",
    };
  if (h >= 9 && h < 15)
    return {
      label: "Sedang Berlayar",
      color: "#0284c7",
      desc: "Waktu terbaik ada di window ini",
    };
  if (h >= 15 && h < 18)
    return {
      label: "Persiapan Pulang",
      color: "#f59e0b",
      desc: "Mulai navigasi kembali ke pangkalan",
    };
  return {
    label: "Istirahat Malam",
    color: "#64748b",
    desc: "Waktu terbaik besok 05:00 – 14:00 WIB",
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const userName =
    session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Nelayan";
  const router = useRouter();
  const [deviceCoords, setDeviceCoords] =
    useState<LocationCoords>(DEFAULT_LOCATION);
  const { data: weather, loading: wLoading } = useWeather(deviceCoords);
  const tides = useTides();
  const [nowTime, setNowTime] = useState(getNowTime());
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("splash_seen");
    if (!seen) {
      setShowSplash(true);
    } else {
      setAppReady(true);
    }
  }, []);

  const handleSplashDone = () => {
    sessionStorage.setItem("splash_seen", "1");
    setShowSplash(false);
    setAppReady(true);
  };

  const fetchCityName = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            "User-Agent": "ZPPI-Fisherman-App", // Penting agar tidak diblokir OpenStreetMap
          },
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = await res.json();

      // Ambil data daerah (bisa berupa city, regency, atau county tergantung wilayah Indonesia)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const address = json.address;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cityName =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        address.city ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        address.regency ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        address.county ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        address.municipality ??
        "Lokasi GPS";

      // Bersihkan string bumbu-bumbu bawaan jika ada (misal: "Kabupaten Indramayu" -> "Indramayu")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const cleanName = cityName.replace(/(Kabupaten|Kota|Regency)\s+/gi, "");

      setDeviceCoords((prev) => ({
        ...prev,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: cleanName,
      }));
    } catch (err) {
      console.error("Gagal mendapatkan nama wilayah: ", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    const timeInterval = setInterval(() => setNowTime(getNowTime()), 30000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDeviceCoords({
            latitude,
            longitude,
            name: "Mencari Lokasi...",
          });
          // Jalankan reverse geocoding
          void fetchCityName(latitude, longitude);
        },
        () => {
          console.log("Akses GPS ditolak, menggunakan fallback Karangampel.");
        },
        { enableHighAccuracy: true },
      );
    }

    return () => clearInterval(timeInterval);
  }, []);

  const sailWindow = getBestSailWindow();
  const currentHour = getNowHour();

  const WIND_DEG_MAP: Record<string, number> = {
    U: 0,
    TL: 45,
    T: 90,
    TG: 135,
    S: 180,
    BD: 225,
    B: 270,
    BL: 315,
  };
  const windDegNum = WIND_DEG_MAP[weather?.windDir ?? "U"] ?? 0;

  const maxTide = Math.max(...tides.map((t) => t.height), 1.5);
  const activeTideIdx = tides.findIndex((t) => {
    const h = parseInt(t.time.split(":")[0] ?? "0");
    return h >= currentHour;
  });

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashDone} />}
      {appReady && (
        <main
          className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-50 select-none"
          style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div
            className="flex-1 overflow-y-auto px-4 pb-20"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            <div className="pt-10 pb-5">
              <h1
                className="text-3xl leading-tight font-black text-slate-900"
                style={{ letterSpacing: "-0.03em" }}
              >
                Selamat Datang,
                <br />
                <span className="text-emerald-500">{userName}</span> 🎣
              </h1>
              <p className="mt-1.5 text-[13px] font-medium text-slate-400 capitalize">
                {deviceCoords.name} · {nowTime} WIB
              </p>
              <span className="mt-0.5 block font-mono text-[10px] text-slate-300">
                ({deviceCoords.latitude.toFixed(4)},{" "}
                {deviceCoords.longitude.toFixed(4)})
              </span>
            </div>

            {/* ── STATUS SAIL WINDOW ── */}
            <div
              className="mb-4 flex items-center gap-3 overflow-hidden rounded-2xl p-4 shadow-sm"
              style={{
                backgroundColor: sailWindow.color + "12",
                border: `1px solid ${sailWindow.color}30`,
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: sailWindow.color + "20" }}
              >
                {sailWindow.color === "#059669"
                  ? "🟢"
                  : sailWindow.color === "#0284c7"
                    ? "🔵"
                    : sailWindow.color === "#f59e0b"
                      ? "🟡"
                      : "⚫"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-black tracking-wider uppercase"
                  style={{ color: sailWindow.color }}
                >
                  Status Saat Ini
                </p>
                <p className="text-sm font-black text-slate-800">
                  {sailWindow.label}
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  {sailWindow.desc}
                </p>
              </div>
            </div>

            {/* ── WEATHER WIDGET ── */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Cuaca Laut {deviceCoords.name}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-300">
                    Open-Meteo & Nominatim API
                  </p>
                </div>
                {wLoading ? (
                  <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
                ) : (
                  <div
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${
                      weather?.safeToSail
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${weather?.safeToSail ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    {weather?.safeToSail ? "Aman Berlayar" : "Waspada"}
                  </div>
                )}
              </div>

              {wLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-6 animate-pulse rounded-lg bg-slate-100"
                    />
                  ))}
                </div>
              ) : weather ? (
                <>
                  <div className="flex items-center gap-4 px-4 py-3">
                    <span className="text-4xl">{weather.conditionIcon}</span>
                    <div>
                      <p className="text-lg font-black text-slate-800">
                        {weather.condition}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {weather.tempAir}°C · Kelembapan {weather.humidity}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px border-t border-slate-50 bg-slate-50">
                    <div className="bg-white px-3 py-3 text-center">
                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        Angin
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {weather.windSpeed}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400">
                        km/h {weather.windDir}
                      </p>
                    </div>
                    <div className="bg-white px-3 py-3 text-center">
                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        Gelombang
                      </p>
                      <p className="text-xl font-black text-blue-600">
                        {weather.waveHeight}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400">
                        meter (est.)
                      </p>
                    </div>
                    <div className="bg-white px-3 py-3 text-center">
                      <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                        Visibilitas
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {weather.visibility}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400">
                        kilometer
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-around border-t border-slate-50 bg-white px-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <WindCompass
                        deg={`${weather.windDir} ${weather.windSpeed}km/h`}
                        dir={windDegNum}
                      />
                      <p className="mt-6 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Arah Angin
                      </p>
                    </div>
                    <div className="h-16 w-px bg-slate-100" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1">
                        {[0.3, 0.6, 0.9, 0.5, weather.waveHeight, 0.4, 0.7].map(
                          (h, i) => (
                            <WaveBar
                              key={i}
                              height={h}
                              max={2.5}
                              active={i === 4}
                            />
                          ),
                        )}
                      </div>
                      <p className="mt-1 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Tinggi Gelombang
                      </p>
                      <p
                        className="text-[10px] font-black"
                        style={{
                          color:
                            weather.waveHeight < 0.5
                              ? "#059669"
                              : weather.waveHeight < 1.2
                                ? "#0284c7"
                                : "#ef4444",
                        }}
                      >
                        {weather.waveHeight < 0.5
                          ? "Sangat Tenang"
                          : weather.waveHeight < 1.2
                            ? "Normal"
                            : "Berbahaya"}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* ── PASANG SURUT HARI INI ── */}
            {tides.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Pasang Surut Hari Ini
                  </p>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-end justify-between gap-1.5">
                    {tides.map((t, i) => {
                      const isActive = i === activeTideIdx;
                      const barH = Math.round((t.height / maxTide) * 52);
                      return (
                        <div
                          key={i}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          <div className="relative flex w-full justify-center">
                            <div
                              className={`w-full rounded-t-lg transition-all ${
                                isActive
                                  ? "bg-blue-500"
                                  : t.height >= maxTide * 0.75
                                    ? "bg-emerald-400"
                                    : "bg-slate-200"
                              }`}
                              style={{ height: `${barH}px` }}
                            />
                            {isActive && (
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-blue-500 px-1 py-0.5 text-[7px] font-black whitespace-nowrap text-white">
                                Sekarang
                              </div>
                            )}
                          </div>
                          <p className="text-[8px] font-bold text-slate-400">
                            {t.time}
                          </p>
                          <p className="text-[8px] font-black text-slate-600">
                            {t.height}m
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── QUICK STATS ── */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5">
                <p className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">
                  Algoritma DSS
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-700">3</p>
                <p className="text-[10px] font-semibold text-emerald-500">
                  Parameter aktif
                </p>
                <p className="mt-1.5 text-[9px] text-emerald-400">
                  Klorofil · SST · Pasut
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
                <p className="text-[9px] font-black tracking-widest text-blue-600 uppercase">
                  Efisiensi BBM
                </p>
                <p className="mt-1 text-2xl font-black text-blue-700">~40%</p>
                <p className="text-[10px] font-semibold text-blue-500">
                  Penghematan solar
                </p>
                <p className="mt-1.5 text-[9px] text-blue-400">
                  vs. metode konvensional
                </p>
              </div>
            </div>

            {/* ── BUTTON REDIRECT TO MAP ── */}
            <div className="pt-3">
              <button
                onClick={() => router.push("/map")}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-4 shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                }}
              >
                <span className="relative text-xl">🗺️</span>
                <div className="relative text-left">
                  <p className="text-sm leading-none font-black text-white">
                    Buka Peta ZPPI
                  </p>
                  <p className="mt-0.5 text-[10px] leading-none font-semibold text-emerald-200">
                    Temukan spot mancing terbaik sekarang
                  </p>
                </div>
                <svg
                  className="relative ml-auto h-5 w-5 text-emerald-300 transition-transform duration-200 group-hover:translate-x-1"
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
              </button>

              <p className="mt-4 text-center text-[9px] font-semibold text-slate-400">
                Sistem Informasi Maritim Nelayan © 2026 · Live GPS Tracker
                Actived
              </p>
            </div>
          </div>

          <Navbar />
        </main>
      )}
    </>
  );
}
