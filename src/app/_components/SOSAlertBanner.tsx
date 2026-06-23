import { TriangleAlert, X } from "lucide-react";
import type { FleetMember } from "~/hooks/useFleetTracking";

interface SOSAlertBannerProps {
  sosAlert: FleetMember;
  onDismiss: () => void;
}

export default function SOSAlertBanner({
  sosAlert,
  onDismiss,
}: SOSAlertBannerProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-4 absolute top-20 right-4 left-4 z-40 rounded-2xl border border-red-200 bg-red-500 p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <TriangleAlert className="text-white" />
        <div className="flex-1">
          <p className="text-[13px] font-black text-white">
            Sinyal SOS Diterima!
          </p>
          <p className="text-[11px] font-medium text-red-100">
            Nelayan butuh bantuan di koordinat {sosAlert.latitude.toFixed(4)},{" "}
            {sosAlert.longitude.toFixed(4)}
          </p>
        </div>
        <button onClick={onDismiss} className="text-red-200">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
