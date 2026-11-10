import { TriangleAlert, X, Navigation } from "lucide-react";
import type { FleetMember } from "~/hooks/useFleetTracking";

interface SOSAlertBannerProps {
  sosAlert: FleetMember;
  onDismiss: () => void;
  onStartRescue?: (lat: number, lng: number, name: string) => void;
}

export default function SOSAlertBanner({
  sosAlert,
  onDismiss,
  onStartRescue,
}: SOSAlertBannerProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-3 absolute top-16 right-2.5 left-2.5 z-40 rounded-2xl border border-rose-300 bg-white/98 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
          <TriangleAlert size={16} className="animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-rose-100 px-1 py-0.2 text-[8px] font-bold text-rose-800 uppercase">
              SOS DARURAT LAUT
            </span>
          </div>
          <p className="mt-0.5 text-xs font-bold text-slate-900 truncate">
            {sosAlert.userName ?? "Rekan Nelayan"} Butuh Bantuan!
          </p>
          <p className="text-[10px] font-mono text-slate-500">
            Koordinat: {sosAlert.latitude.toFixed(4)}, {sosAlert.longitude.toFixed(4)}
          </p>

          {onStartRescue && (
            <button
              onClick={() => {
                onStartRescue(
                  sosAlert.latitude,
                  sosAlert.longitude,
                  sosAlert.userName ?? "Nelayan",
                );
                onDismiss();
              }}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95"
            >
              <Navigation size={12} />
              <span>Arahkan Rute SAR</span>
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
