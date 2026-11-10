"use client";

import { FISH_OPTIONS } from "~/types/constants";
import type { FishType } from "~/types/type";
import { HardDrive, LifeBuoy, ChevronDown, WifiOff } from "lucide-react";

interface TopBarProps {
  gpsActive: boolean;
  fishType: FishType;
  onFishTypeChange: (fishType: FishType) => void;
  showFishDropdown: boolean;
  onToggleFishDropdown: () => void;
  isOffline?: boolean;
  onOpenOfflineModal?: () => void;
  onOpenEmergencyModal?: () => void;
  activeEmergencyCount?: number;
}

export default function TopBar({
  fishType,
  onFishTypeChange,
  showFishDropdown,
  onToggleFishDropdown,
  isOffline = false,
  onOpenOfflineModal,
  onOpenEmergencyModal,
  activeEmergencyCount = 0,
}: TopBarProps) {
  const activeFish = FISH_OPTIONS.find((f) => f.value === fishType)!;

  return (
    <div className="absolute top-2.5 right-2.5 left-2.5 z-[35]">
      <div className="flex h-11 items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-2.5 shadow-sm backdrop-blur-md">
        {/* Left: Offline / Cache button */}
        {onOpenOfflineModal ? (
          <button
            onClick={onOpenOfflineModal}
            title="Penyimpanan Peta Offline"
            className={`flex h-7 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all active:scale-95 ${
              isOffline
                ? "border border-amber-300 bg-amber-50 text-amber-800"
                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {isOffline ? (
              <WifiOff size={13} className="text-amber-600" />
            ) : (
              <HardDrive size={13} className="text-slate-600" />
            )}
            <span>{isOffline ? "Offline" : "Peta Offline"}</span>
          </button>
        ) : (
          <div />
        )}

        {/* Right Actions: SOS and Fish Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* SOS button */}
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              title="Pusat Darurat Laut"
              className="relative flex h-7 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95 shadow-sm shadow-rose-100/50"
            >
              <LifeBuoy
                size={13}
                className={activeEmergencyCount > 0 ? "animate-spin text-rose-600" : "text-rose-500"}
              />
              <span>SOS</span>
              {activeEmergencyCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white">
                  {activeEmergencyCount}
                </span>
              )}
            </button>
          )}

          {/* Fish Selector Pill */}
          <div className="relative">
            <button
              onClick={onToggleFishDropdown}
              className="flex h-7 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
            >
              <span className="text-sm">{activeFish.emoji}</span>
              <span className="max-w-[120px] truncate">{activeFish.label}</span>
              <ChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>

            {showFishDropdown && (
              <div className="animate-in fade-in zoom-in-95 duration-100 absolute top-full right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {FISH_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => onFishTypeChange(f.value)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                      fishType === f.value
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{f.emoji}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
