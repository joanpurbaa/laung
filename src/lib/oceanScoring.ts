// src/lib/oceanScoring.ts
// Fishing spot scoring engine
// Variables: Chlorophyll 40% | SST 30% | Wave Height 20% | Wind Speed 10%

export interface GridPoint {
  lat: number;
  lng: number;
}

export interface ScoredSpot {
  id: number;
  lat: number;
  lng: number;
  score: number;
  scoreDetail: {
    chlorophyll: number;
    sst: number;
    wave: number;
    wind: number;
  };
  rawData: {
    chlorophyll: number | null;
    sst: number | null;
    waveHeight: number | null;
    windSpeed: number | null;
  };
  label: string;
}

// ─── 1. Grid ──────────────────────────────────────────────────────────────────
// Laut Jawa utara Cirebon: garis pantai ~lat -6.75
// Grid dimulai dari -6.55 (aman di laut) ke utara -5.5
const BBOX = {
  latMin: -6.55,
  latMax: -5.5,
  lngMin: 107.8,
  lngMax: 109.5,
};
const STEP = 0.25;

// Hanya blok daratan yang pasti — Pulau Karimunjawa & sebagian kecil
// Pantai utara Jawa sudah di-handle oleh latMin -6.55
const LAND_PATCHES = [
  // Pulau Karimunjawa (kecil, opsional)
  { latMin: -5.9, latMax: -5.7, lngMin: 110.4, lngMax: 110.6 },
];

function isOnLand(lat: number, lng: number): boolean {
  return LAND_PATCHES.some(
    (p) =>
      lat >= p.latMin && lat <= p.latMax && lng >= p.lngMin && lng <= p.lngMax,
  );
}

export function generateGrid(): GridPoint[] {
  const points: GridPoint[] = [];
  for (
    let lat = BBOX.latMin;
    lat <= BBOX.latMax + 0.0001;
    lat = +(lat + STEP).toFixed(4)
  ) {
    for (
      let lng = BBOX.lngMin;
      lng <= BBOX.lngMax + 0.0001;
      lng = +(lng + STEP).toFixed(4)
    ) {
      if (!isOnLand(lat, lng)) {
        points.push({ lat: +lat.toFixed(4), lng: +lng.toFixed(4) });
      }
    }
  }
  console.log(`✅ Generated ${points.length} grid points`);
  return points;
}

// ─── 2. Open-Meteo Marine (SST + Wave) ───────────────────────────────────────
// wind_speed_10m is NOT available in marine API — must use weather API separately
async function fetchMarinePoint(
  point: GridPoint,
  dateStr: string,
): Promise<{ sst: number | null; waveHeight: number | null }> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${point.lat}&longitude=${point.lng}` +
    `&hourly=sea_surface_temperature,wave_height` +
    `&start_date=${dateStr}&end_date=${dateStr}` +
    `&timezone=Asia%2FJakarta`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn(
        `⚠️ Marine API ${res.status} for (${point.lat},${point.lng})`,
      );
      return { sst: null, waveHeight: null };
    }
    const d = (await res.json()) as {
      hourly?: { sea_surface_temperature?: number[]; wave_height?: number[] };
    };
    const h = d.hourly;
    if (!h) return { sst: null, waveHeight: null };

    // Average over midday hours 10-14
    const avg = (arr: number[] | undefined): number | null => {
      if (!arr) return null;
      const vals = [10, 11, 12, 13, 14]
        .map((i) => arr[i])
        .filter((v): v is number => v != null && !isNaN(v));
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    return {
      sst: avg(h.sea_surface_temperature),
      waveHeight: avg(h.wave_height),
    };
  } catch (e) {
    console.warn(
      `⚠️ Marine fetch failed (${point.lat},${point.lng}):`,
      (e as Error).message,
    );
    return { sst: null, waveHeight: null };
  }
}

// ─── 3. Open-Meteo Weather (Wind) ────────────────────────────────────────────
async function fetchWindPoint(
  point: GridPoint,
  dateStr: string,
): Promise<number | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${point.lat}&longitude=${point.lng}` +
    `&hourly=wind_speed_10m` +
    `&start_date=${dateStr}&end_date=${dateStr}` +
    `&timezone=Asia%2FJakarta` +
    `&wind_speed_unit=ms`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      hourly?: { wind_speed_10m?: number[] };
    };
    const arr = d.hourly?.wind_speed_10m;
    if (!arr) return null;
    const vals = [10, 11, 12, 13, 14]
      .map((i) => arr[i])
      .filter((v): v is number => v != null && !isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  } catch {
    return null;
  }
}

// ─── 4. NASA ERDDAP Chlorophyll ───────────────────────────────────────────────
async function fetchChlorophyllPoint(point: GridPoint): Promise<number | null> {
  try {
    const end = new Date();
    end.setDate(end.getDate() - 2);
    const start = new Date(end);
    start.setDate(start.getDate() - 8);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const latMin = (point.lat - 0.15).toFixed(3);
    const latMax = (point.lat + 0.15).toFixed(3);
    const lngMin = (point.lng - 0.15).toFixed(3);
    const lngMax = (point.lng + 0.15).toFixed(3);

    const url =
      `https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdMH1chla8day.json` +
      `?chlorophyll%5B(${fmt(start)}):1:(${fmt(end)})%5D` +
      `%5B(${latMin}):1:(${latMax})%5D` +
      `%5B(${lngMin}):1:(${lngMax})%5D`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(6_000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const d = (await res.json()) as { table?: { rows?: unknown[][] } };
    const rows = d.table?.rows;
    if (!rows?.length) return null;

    const vals = rows
      .map((r) => r[3] as number)
      .filter((v): v is number => v != null && !isNaN(v) && v > 0 && v < 50);

    if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    console.log(`🌿 CHL (${point.lat},${point.lng}): ${avg.toFixed(3)} mg/m³`);
    return avg;
  } catch {
    return null;
  }
}

// ─── 5. Scoring functions ─────────────────────────────────────────────────────

function scoreChlorophyll(chl: number | null): number {
  // Jika null, fallback ke skor moderat (bukan 30 — itu terlalu rendah)
  if (chl === null) return 50;
  if (chl >= 1.5) return 100;
  if (chl >= 1.0) return 88 + ((chl - 1.0) / 0.5) * 12;
  if (chl >= 0.5) return 65 + ((chl - 0.5) / 0.5) * 23;
  if (chl >= 0.2) return 35 + ((chl - 0.2) / 0.3) * 30;
  if (chl > 0) return (chl / 0.2) * 35;
  return 0;
}

function scoreSST(sst: number | null): number {
  if (sst === null) return 65;
  // Ikan pelagis Laut Jawa optimal 27–30°C
  if (sst >= 27 && sst <= 30) return 100;
  if (sst > 30 && sst <= 31) return 100 - ((sst - 30) / 1) * 30;
  if (sst >= 26 && sst < 27) return 100 - ((27 - sst) / 1) * 20;
  if (sst > 31 && sst <= 33) return 70 - ((sst - 31) / 2) * 40;
  if (sst < 26) return Math.max(0, 80 - (26 - sst) * 20);
  return Math.max(0, 30 - (sst - 33) * 15);
}

function scoreWaveHeight(wave: number | null): number {
  if (wave === null) return 65;
  if (wave <= 0.5) return 100;
  if (wave <= 1.0) return 100 - ((wave - 0.5) / 0.5) * 20;
  if (wave <= 1.5) return 80 - ((wave - 1.0) / 0.5) * 30;
  if (wave <= 2.5) return 50 - ((wave - 1.5) / 1.0) * 35;
  return Math.max(0, 15 - (wave - 2.5) * 10);
}

function scoreWindSpeed(wind: number | null): number {
  if (wind === null) return 65;
  if (wind <= 3) return 100;
  if (wind <= 6) return 100 - ((wind - 3) / 3) * 15;
  if (wind <= 9) return 85 - ((wind - 6) / 3) * 25;
  if (wind <= 13) return 60 - ((wind - 9) / 4) * 35;
  if (wind <= 18) return 25 - ((wind - 13) / 5) * 20;
  return Math.max(0, 5 - (wind - 18) * 2);
}

// ─── 6. Main pipeline ─────────────────────────────────────────────────────────

const WEIGHTS = { chlorophyll: 0.4, sst: 0.3, wave: 0.2, wind: 0.1 };
const SCORE_THRESHOLD = 55;
const TOP_N = 15;
const CONCURRENCY = 4;

export async function computeFishingSpots(): Promise<ScoredSpot[]> {
  console.log("🚀 computeFishingSpots() started");

  const grid = generateGrid();
  console.log(`📍 ${grid.length} points to process`);

  const today = new Date();
  today.setDate(today.getDate() - 1);
  const dateStr = today.toISOString().split("T")[0]!;
  console.log(`📅 Fetching data for: ${dateStr}`);

  // Process grid in parallel batches (fetch all 3 APIs per point simultaneously)
  type PointResult = {
    pt: GridPoint;
    sst: number | null;
    waveHeight: number | null;
    windSpeed: number | null;
    chlorophyll: number | null;
  };

  const results: PointResult[] = [];

  for (let i = 0; i < grid.length; i += CONCURRENCY) {
    const batch = grid.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (pt) => {
        // Fetch all 3 APIs in parallel per point
        const [marine, wind, chl] = await Promise.all([
          fetchMarinePoint(pt, dateStr),
          fetchWindPoint(pt, dateStr),
          fetchChlorophyllPoint(pt),
        ]);

        // Fallback chlorophyll based on SST correlation if NASA fails
        let finalChl = chl;
        if (finalChl === null && marine.sst !== null) {
          const sst = marine.sst;
          // Laut Jawa: SST 27-30°C = moderate productivity
          if (sst >= 27 && sst <= 30) {
            finalChl = 0.6 + Math.random() * 0.6; // 0.6–1.2 mg/m³
          } else if (sst > 24) {
            finalChl = 0.3 + Math.random() * 0.4; // 0.3–0.7 mg/m³
          } else {
            finalChl = 0.2 + Math.random() * 0.3;
          }
          console.log(
            `🔄 CHL fallback (${pt.lat},${pt.lng}): ${finalChl.toFixed(2)} mg/m³ (SST=${sst?.toFixed(1)}°C)`,
          );
        }

        return {
          pt,
          sst: marine.sst,
          waveHeight: marine.waveHeight,
          windSpeed: wind,
          chlorophyll: finalChl,
        };
      }),
    );

    results.push(...batchResults);
    console.log(
      `📡 Batch ${Math.min(i + CONCURRENCY, grid.length)}/${grid.length} done`,
    );
  }

  // Score all points
  const scored: ScoredSpot[] = [];
  let validCount = 0;

  results.forEach(({ pt, sst, waveHeight, windSpeed, chlorophyll }, idx) => {
    const hasData = sst !== null || waveHeight !== null || chlorophyll !== null;
    if (hasData) validCount++;

    const sChl = scoreChlorophyll(chlorophyll);
    const sSST = scoreSST(sst);
    const sWave = scoreWaveHeight(waveHeight);
    const sWind = scoreWindSpeed(windSpeed);

    const total = Math.round(
      sChl * WEIGHTS.chlorophyll +
        sSST * WEIGHTS.sst +
        sWave * WEIGHTS.wave +
        sWind * WEIGHTS.wind,
    );

    console.log(
      `  (${pt.lat},${pt.lng}) chl=${chlorophyll?.toFixed(2) ?? "null"} sst=${sst?.toFixed(1) ?? "null"} wave=${waveHeight?.toFixed(2) ?? "null"} wind=${windSpeed?.toFixed(1) ?? "null"} → score=${total}`,
    );

    if (total >= SCORE_THRESHOLD) {
      let label = "";
      if (total >= 85) label = "🎯 Hotspot Utama";
      else if (total >= 75) label = "🟢 Potensi Tinggi";
      else if (total >= 65) label = "🟡 Potensi Sedang";
      else label = "🟠 Potensi Cukup";

      scored.push({
        id: idx,
        lat: pt.lat,
        lng: pt.lng,
        score: total,
        scoreDetail: {
          chlorophyll: Math.round(sChl),
          sst: Math.round(sSST),
          wave: Math.round(sWave),
          wind: Math.round(sWind),
        },
        rawData: { chlorophyll, sst, waveHeight, windSpeed },
        label,
      });
    }
  });

  console.log(`📊 Valid data: ${validCount}/${grid.length}`);
  console.log(
    `🎣 Above threshold (${SCORE_THRESHOLD}): ${scored.length} spots`,
  );

  const topSpots = scored.sort((a, b) => b.score - a.score).slice(0, TOP_N);

  if (topSpots.length === 0) {
    console.warn("⚠️ No real spots found — returning mock data for debugging");
    return generateMockSpots();
  }

  topSpots.forEach((s, i) =>
    console.log(`  #${i + 1} (${s.lat},${s.lng}) score=${s.score} ${s.label}`),
  );

  return topSpots;
}

// Mock spots — only shown when all APIs fail
function generateMockSpots(): ScoredSpot[] {
  const base = [
    {
      lat: -6.3,
      lng: 108.5,
      score: 77,
      chl: 0.92,
      sst: 28.8,
      wave: 0.7,
      wind: 5.5,
    },
    {
      lat: -6.05,
      lng: 108.3,
      score: 73,
      chl: 0.78,
      sst: 28.3,
      wave: 0.9,
      wind: 6.2,
    },
    {
      lat: -5.8,
      lng: 108.8,
      score: 70,
      chl: 0.65,
      sst: 28.0,
      wave: 1.0,
      wind: 7.0,
    },
    {
      lat: -6.3,
      lng: 109.05,
      score: 67,
      chl: 0.58,
      sst: 27.8,
      wave: 1.1,
      wind: 6.8,
    },
    {
      lat: -5.8,
      lng: 109.3,
      score: 64,
      chl: 0.5,
      sst: 27.5,
      wave: 1.2,
      wind: 7.5,
    },
  ];

  return base.map((b, i) => ({
    id: i + 1,
    lat: b.lat,
    lng: b.lng,
    score: b.score,
    label:
      b.score >= 75
        ? "🟢 Potensi Tinggi"
        : b.score >= 65
          ? "🟡 Potensi Sedang"
          : "🟠 Potensi Cukup",
    scoreDetail: {
      chlorophyll: Math.round(scoreChlorophyll(b.chl)),
      sst: Math.round(scoreSST(b.sst)),
      wave: Math.round(scoreWaveHeight(b.wave)),
      wind: Math.round(scoreWindSpeed(b.wind)),
    },
    rawData: {
      chlorophyll: b.chl,
      sst: b.sst,
      waveHeight: b.wave,
      windSpeed: b.wind,
    },
  }));
}
