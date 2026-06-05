// src/app/_components/MapClient.tsx
"use client";

import dynamic from "next/dynamic";

// Di sini ssr: false diizinkan karena berada di dalam Client Component
const FishingMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
      <p className="animate-pulse text-sm font-medium tracking-wide">
        Membaca Database Klorofil...
      </p>
    </div>
  ),
});

export default function MapClient() {
  return (
    <div className="h-full w-full">
      {/* Panggil komponen peta hasil dynamic import */}
      <FishingMap />
    </div>
  );
}
