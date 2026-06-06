"use client";

import { type ComponentProps } from "react";
import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ActualMapProps = ComponentProps<typeof import("./Map").default>;

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

export default function MapClient(props: ActualMapProps) {
  return (
    <div className="h-full w-full">
      <FishingMap {...props} />
    </div>
  );
}
