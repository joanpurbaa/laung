import "server-only";
import { createHash } from "crypto";
import { redis } from "~/lib/redis";

const DEFAULT_WINDOW_SECONDS = 60 * 60;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export async function consumeRateLimit(
  key: string,
  maxPerWindow: number,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
): Promise<RateLimitResult> {
  const fullKey = `rl:lapor-hilang:${key}`;
  const count = await redis.incr(fullKey);
  if (count === 1) {
    await redis.expire(fullKey, windowSeconds).catch(() => undefined);
  }
  if (count > maxPerWindow) {
    const ttl = await redis.ttl(fullKey).catch(() => windowSeconds);
    const retryAfterSeconds =
      typeof ttl === "number" && ttl > 0 ? ttl : windowSeconds;
    return { ok: false, retryAfterSeconds };
  }
  return { ok: true };
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}