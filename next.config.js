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
  // pdfkit 0.20 memakai internal imports "#standard-fonts/*" yang tidak
  // di-resolve dengan benar oleh bundler. Jadikan external agar Node
  // me-resolve-nya saat runtime, dan sertakan data font ke serverless.
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/lapor-hilang": ["./node_modules/pdfkit/**/*"],
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