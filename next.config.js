/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Abaikan error tipe saat build (gunakan ini jika ingin deploy cepat)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Abaikan error lint saat build
    ignoreDuringBuilds: true,
  },
  // ── TAMBAHAN UNTUK FIX DEV TUNNELS MOBILE (NEXT.JS 15) ────────────────
  experimental: {
    serverActions: {
      allowedOrigins: [
        "dsfdbz9j-3000.asse.devtunnels.ms", // Alamat Dev Tunnels HP lu
        "localhost:3000",                   // Alamat lokal laptop lu
      ],
    },
  },
};

export default config;