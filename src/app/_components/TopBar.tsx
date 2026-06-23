import Image from "next/image";
import { FISH_OPTIONS } from "~/types/constants";
import type { FishType } from "~/types/type";

interface TopBarProps {
  gpsActive: boolean;
  fishType: FishType;
  onFishTypeChange: (fishType: FishType) => void;
  showFishDropdown: boolean;
  onToggleFishDropdown: () => void;
}

export default function TopBar({
  gpsActive,
  fishType,
  onFishTypeChange,
  showFishDropdown,
  onToggleFishDropdown,
}: TopBarProps) {
  const activeFish = FISH_OPTIONS.find((f) => f.value === fishType)!;

  return (
    <div className="absolute top-0 right-0 left-0 z-10 px-3 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/60 bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
          <Image
            className="h-8 w-8"
            src={"/icon.svg"}
            width={100}
            height={100}
            alt="icon"
          />
          <div className="min-w-0 flex-1">
            <div className="mt-0.5 flex items-center gap-1">
              {gpsActive ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-emerald-600">
                    GPS Terhubung
                  </span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-[9px] font-bold text-amber-600">
                    Menunggu GPS…
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-blue-600">LIVE</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={onToggleFishDropdown}
            className="relative z-10 flex h-[52px] items-center gap-1.5 rounded-2xl border border-white/60 bg-white/90 px-3 shadow-lg backdrop-blur-md"
          >
            <span className="text-base">{activeFish.emoji}</span>
            <svg
              className="h-3 w-3 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showFishDropdown && (
            <div className="absolute top-full right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
              {FISH_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => onFishTypeChange(f.value)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                    fishType === f.value
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm">{f.emoji}</span>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
