"use client";

import dynamic from "next/dynamic";
import type { ActualMapProps, MapClientProps } from "~/types/map";

const FishingMap = dynamic<ActualMapProps>(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-700">
      <p className="animate-pulse text-sm font-medium tracking-wide">
        Menyiapkan Sistem Navigasi...
      </p>
    </div>
  ),
});

export default function MapClient({
  fleetMembers,
  myLocation,
  ...mapProps
}: MapClientProps) {
  return (
    <div className="relative h-full w-full">
      <FishingMap {...mapProps} />
    </div>
  );
}
