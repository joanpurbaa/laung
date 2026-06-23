import { Satellite } from "lucide-react";
import { LAYER_OPTIONS } from "~/types/constants";
import type { ViewMode } from "~/types/type";

interface LayerControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenFamilyModal: () => void;
  onRecenter: () => void;
}

export default function LayerControls({
  viewMode,
  onViewModeChange,
  onOpenFamilyModal,
  onRecenter,
}: LayerControlsProps) {
  return (
    <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2">
      {LAYER_OPTIONS.map((layer) => {
        const IconComponent = layer.icon;
        return (
          <button
            key={layer.value}
            onClick={() => {
              if (layer.value === "pesan") {
                onOpenFamilyModal();
              } else {
                onViewModeChange(layer.value);
              }
            }}
            title={layer.label}
            className={`flex h-11 w-11 flex-col items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md transition-all ${
              viewMode === layer.value && layer.value !== "pesan"
                ? "border-emerald-300 bg-emerald-500 text-white shadow-emerald-200"
                : "border-white/60 bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            <IconComponent size={18} strokeWidth={2} />
            <span className="mt-0.5 text-[8px] font-bold">{layer.label}</span>
          </button>
        );
      })}

      <button
        onClick={onRecenter}
        className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-blue-500 shadow-lg backdrop-blur-md"
      >
        <Satellite size={18} strokeWidth={2} />
        <span className="mt-0.5 text-[8px] font-bold">GPS</span>
      </button>
    </div>
  );
}
