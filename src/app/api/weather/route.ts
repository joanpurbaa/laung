import { NextResponse } from "next/server";
import { redis } from "~/lib/redis";

const CACHE_TTL = 600; // 10 menit
const STALE_TTL = 86400; // 24 jam

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");

  if (!latRaw || !lonRaw) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const lat = parseFloat(latRaw);
  const lon = parseFloat(lonRaw);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat/lon invalid" }, { status: 400 });
  }

  const roundedLat = lat.toFixed(2);
  const roundedLon = lon.toFixed(2);
  const CACHE_KEY = `cache:weather:${roundedLat}:${roundedLon}`;
  const STALE_KEY = `stale:weather:${roundedLat}:${roundedLon}`;

  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ ...(cached as object), stale: false });
    }
  } catch (redisErr) {
    console.error("Redis get error (lanjut tanpa cache):", redisErr);
  }

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENWEATHER_API_KEY belum di-set di .env");
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Upstream status ${res.status}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const raw = await res.json();

    // Normalisasi ke bentuk yang sama seperti sebelumnya (Open-Meteo shape)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const normalized = {
      current: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        temperature_2m: raw.main?.temp ?? 28,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        relative_humidity_2m: raw.main?.humidity ?? 75,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        wind_speed_10m: (raw.wind?.speed ?? 0) * 3.6, // m/s -> km/h
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        wind_direction_10m: raw.wind?.deg ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        weather_code: raw.weather?.[0]?.id ?? 800,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        visibility: raw.visibility ?? 10000,
      },
    };

    try {
      await redis.set(CACHE_KEY, normalized, { ex: CACHE_TTL });
      await redis.set(STALE_KEY, normalized, { ex: STALE_TTL });
    } catch (redisErr) {
      console.error("Redis set error (data tetap dikirim):", redisErr);
    }

    return NextResponse.json({ ...normalized, stale: false });
  } catch (fetchErr) {
    console.error("Gagal fetch weather live:", fetchErr);

    try {
      const staleData = await redis.get(STALE_KEY);
      if (staleData) {
        return NextResponse.json({ ...(staleData as object), stale: true });
      }
    } catch (redisErr) {
      console.error("Redis stale-get error:", redisErr);
    }

    return NextResponse.json(
      { error: "Gagal ambil data cuaca dan tidak ada data cadangan" },
      { status: 502 },
    );
  }
}
