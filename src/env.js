// src/env.js
// Merge bagian UPSTASH_* ke env.js kamu yang existing.
// Jangan replace seluruh file — hanya tambah baris yang ditandai ✨

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // DATABASE_URL: z.string().url(),
    // AUTH_SECRET:
    //   process.env.NODE_ENV === "production"
    //     ? z.string()
    //     : z.string().optional(),

    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    AUTH_SECRET: z.string().optional(),
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,

    // ✨ Tambah dua baris ini ─────────────────────────────────────────────
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    // ────────────────────────────────────────────────────────────────────

    NODE_ENV: process.env.NODE_ENV,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});