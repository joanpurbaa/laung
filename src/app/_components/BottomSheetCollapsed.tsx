import type { GeoSpot } from "~/types/map";
import { getScoreLabel } from "~/types/utils";

interface BottomSheetCollapsedProps {
  topSpot: GeoSpot | null;
  loading: boolean;
  zppiSpots: GeoSpot[];
  userLocation: { lat: number; lng: number } | null;
  distance: number;
  fuelSavingPercent: number;
  onExpand: () => void;
}

export default function BottomSheetCollapsed({
  topSpot,
  loading,
  zppiSpots,
  userLocation,
  distance,
  fuelSavingPercent,
  onExpand,
}: BottomSheetCollapsedProps) {
  return (
    <div className="mx-3">
      <button
        onClick={onExpand}
        className="w-full overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {topSpot && (
            <>
              <div
                className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm"
                style={{
                  backgroundColor: getScoreLabel(topSpot.value).color,
                }}
              >
                <span className="text-lg leading-none font-black">
                  {topSpot.value}
                </span>
                <span className="text-[8px] leading-none font-bold opacity-80">
                  SKOR
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Rekomendasi Terbaik Hari Ini
                </p>
                <p className="text-sm font-black text-slate-800">
                  Spot A · Hemat {fuelSavingPercent}% Solar
                </p>
                <p className="text-[10px] font-semibold text-slate-400">
                  {userLocation
                    ? `${distance.toFixed(1)} Km dari posisimu`
                    : "Menunggu GPS…"}{" "}
                  · 09:00–15:00 WIB
                </p>
              </div>
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </div>
            </>
          )}
          {!topSpot && (
            <p className="text-sm text-slate-400">
              {loading ? "Memuat data..." : "Tap untuk melihat rekomendasi"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
          <div className="py-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
              Potensial
            </p>
            <p className="text-sm font-black text-emerald-600">
              {zppiSpots.filter((s) => s.value >= 70).length}
            </p>
          </div>
          <div className="py-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
              Sangat Baik
            </p>
            <p className="text-sm font-black text-blue-600">
              {zppiSpots.filter((s) => s.value >= 85).length}
            </p>
          </div>
          <div className="py-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
              Kondisi Air
            </p>
            <p className="text-sm font-black text-cyan-600">Optimal</p>
          </div>
        </div>
      </button>
    </div>
  );
}
