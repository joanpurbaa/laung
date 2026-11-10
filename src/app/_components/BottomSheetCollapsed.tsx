import type { GeoSpot } from "~/types/map";
import { getScoreLabel } from "~/types/utils";
import { ChevronUp } from "lucide-react";

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
  userLocation,
  distance,
  fuelSavingPercent,
  onExpand,
}: BottomSheetCollapsedProps) {
  const scoreInfo = topSpot ? getScoreLabel(topSpot.value) : null;

  return (
    <div className="mx-2.5">
      <button
        onClick={onExpand}
        className="flex w-full items-center justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-md transition-all active:scale-[0.99]"
      >
        {topSpot ? (
          <>
            {/* Skor badge */}
            <div
              className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-sm"
              style={{
                backgroundColor: scoreInfo?.color ?? "#059669",
              }}
            >
              <span className="text-base font-black leading-none">
                {topSpot.value}
              </span>
              <span className="text-[7.5px] font-bold uppercase leading-none opacity-90">
                SKOR
              </span>
            </div>

            {/* Rekomendasi Spot Info */}
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  Spot Terbaik · Hemat {fuelSavingPercent}% BBM
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {userLocation
                  ? `${distance.toFixed(1)} km dari posisi`
                  : "Menunggu GPS"}
                {" · "}
                <span className="text-emerald-600 font-semibold">09:00–15:00 WIB</span>
              </p>
            </div>

            {/* Expand indicator */}
            <div className="flex items-center gap-1 shrink-0 text-slate-400 pl-1">
              <span className="text-[10px] font-semibold hidden sm:inline">Detail</span>
              <ChevronUp size={16} />
            </div>
          </>
        ) : (
          <div className="flex w-full items-center justify-center py-1 text-xs text-slate-400">
            {loading ? "Memuat rekomendasi tangkapan..." : "Pilih titik di peta"}
          </div>
        )}
      </button>
    </div>
  );
}
