// src/lib/redis.ts
// Upstash Redis client — HTTP-based, serverless-safe
// Tidak butuh persistent connection seperti ioredis

import { Redis } from "@upstash/redis";
import { env } from "~/env";

// Upstash Redis singleton
// globalThis trick tetap dipakai biar Next.js hot-reload tidak buat instance baru
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis: Redis =
  globalForRedis.redis ??
  (globalForRedis.redis = new Redis({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    url: env.UPSTASH_REDIS_REST_URL,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }));
