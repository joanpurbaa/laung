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
    <div className="absolute top-[48%] right-2.5 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md backdrop-blur-md divide-y divide-slate-100">
      {LAYER_OPTIONS.map((layer) => {
        const IconComponent = layer.icon;
        const isActive = viewMode === layer.value;

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
            className={`flex h-10 w-10 flex-col items-center justify-center transition-all active:scale-90 ${
              isActive
                ? "bg-emerald-500 text-white font-bold"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <IconComponent size={16} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[7.5px] font-bold leading-none mt-0.5">
              {layer.label}
            </span>
          </button>
        );
      })}

      <button
        onClick={onRecenter}
        title="Pusatkan GPS"
        className="flex h-10 w-10 flex-col items-center justify-center text-blue-600 transition-all hover:bg-slate-50 active:scale-90"
      >
        <Satellite size={16} strokeWidth={2} />
        <span className="text-[7.5px] font-bold leading-none mt-0.5">GPS</span>
      </button>
    </div>
  );
}
