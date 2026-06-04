// src/lib/spotsCache.ts
// Cache layer: Upstash Redis + stale-while-revalidate pattern
//
// Flow:
//   1. GET /api/spots dipanggil
//   2. Cek Redis key "fishing:spots:cirebon"
//   3a. HIT  → return cached JSON (< 10ms via HTTP)
//   3b. MISS → compute (~30-60s) → simpan ke Redis TTL 1 jam → return
//   4. Jika TTL < 5 menit → background refresh (request tetap cepat)

import { redis } from "~/lib/redis";
import { computeFishingSpots, type ScoredSpot } from "~/lib/oceanScoring";

const CACHE_KEY = "fishing:spots:cirebon";
const CACHE_TTL = 60 * 60; // 1 jam (detik)
const REFRESH_THRESHOLD = 5 * 60; // background refresh jika TTL < 5 menit

export interface CachedSpotsPayload {
  spots: ScoredSpot[];
  generatedAt: string;
  fromCache: boolean;
  ttlRemaining?: number;
}

let isRefreshing = false;

export async function getSpotsWithCache(): Promise<CachedSpotsPayload> {
  try {
    // Upstash: get + ttl dalam satu round-trip via pipeline
    const pipeline = redis.pipeline();
    pipeline.get(CACHE_KEY);
    pipeline.ttl(CACHE_KEY);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const [[, cached], [, ttl]] = (await pipeline.exec()) as [
      [null, string | null],
      [null, number],
    ];

    if (cached) {
      const payload =
        typeof cached === "string"
          ? (JSON.parse(cached) as CachedSpotsPayload)
          : (cached as CachedSpotsPayload); // Upstash kadang auto-parse JSON

      console.log(`📦 Cache HIT — TTL sisa: ${ttl}s`);

      if (ttl > 0 && ttl < REFRESH_THRESHOLD && !isRefreshing) {
        console.log(`🔄 Background refresh triggered (TTL=${ttl}s)`);
        void triggerBackgroundRefresh();
      }

      return { ...payload, fromCache: true, ttlRemaining: ttl > 0 ? ttl : 0 };
    }

    console.log("📭 Cache MISS — computing fresh spots...");
    return await computeAndCache();
  } catch (err) {
    console.error("⚠️ Redis error, falling back to direct compute:", err);
    const spots = await computeFishingSpots();
    return { spots, generatedAt: new Date().toISOString(), fromCache: false };
  }
}

async function computeAndCache(): Promise<CachedSpotsPayload> {
  const spots = await computeFishingSpots();
  const generatedAt = new Date().toISOString();
  const payload: CachedSpotsPayload = { spots, generatedAt, fromCache: false };

  try {
    // Upstash: setex = SET dengan EX (TTL dalam detik)
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(payload));
    console.log(`✅ Cached ${spots.length} spots — TTL=${CACHE_TTL}s`);
  } catch (err) {
    console.error("⚠️ Failed to write Redis cache:", err);
  }

  return payload;
}

async function triggerBackgroundRefresh(): Promise<void> {
  isRefreshing = true;
  try {
    console.log("🔄 Background refresh started...");
    await computeAndCache();
    console.log("✅ Background refresh complete");
  } catch (err) {
    console.error("❌ Background refresh failed:", err);
  } finally {
    isRefreshing = false;
  }
}

export async function invalidateCache(): Promise<void> {
  await redis.del(CACHE_KEY);
  console.log("🗑️ Cache invalidated");
}

export async function getCacheStatus(): Promise<{
  exists: boolean;
  ttl: number;
  isRefreshing: boolean;
}> {
  const ttl = await redis.ttl(CACHE_KEY);
  return { exists: ttl > 0, ttl, isRefreshing };
}
