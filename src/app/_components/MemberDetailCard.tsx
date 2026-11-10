import { AlertTriangle, Navigation, Phone, X } from "lucide-react";
import type { FleetMember } from "~/hooks/useFleetTracking";

interface MemberDetailCardProps {
  member: FleetMember;
  isShared: boolean;
  onClose: () => void;
  onShare: (userId: string, userName: string) => void;
  onUnshare: (userId: string, userName: string) => void;
  onSendSOS: () => void;
  onStartRescueNavigation?: (lat: number, lng: number, name: string) => void;
}

export default function MemberDetailCard({
  member,
  isShared,
  onClose,
  onShare,
  onUnshare,
  onSendSOS,
  onStartRescueNavigation,
}: MemberDetailCardProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-3 absolute top-16 right-3 left-3 z-30 max-w-sm duration-200 sm:mx-auto">
      <div
        className={`w-full rounded-2xl p-3.5 shadow-xl backdrop-blur-md border ${
          member.isSOS
            ? "border-rose-300 bg-white text-slate-900 ring-1 ring-rose-200"
            : "border-slate-200/90 bg-white/95 text-slate-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                member.isSOS ? "bg-rose-500 animate-ping" : "bg-emerald-500"
              }`}
            />
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {member.userName ?? "Nelayan"}
              {member.isSOS && (
                <span className="ml-1 text-[10px] font-bold text-rose-600">
                  (DARURAT SOS)
                </span>
              )}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        </div>

        {member.isSOS ? (
          /* Tampilan Nelayan Butuh Bantuan */
          <div className="space-y-2.5">
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-2 text-[11px] text-rose-800">
              <p className="font-bold">⚠️ Nelayan ini membutuhkan bantuan darurat di laut!</p>
              <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                Posisi: {member.latitude.toFixed(4)}, {member.longitude.toFixed(4)}
              </p>
            </div>

            <div className="flex gap-2">
              {onStartRescueNavigation && (
                <button
                  onClick={() =>
                    onStartRescueNavigation(
                      member.latitude,
                      member.longitude,
                      member.userName ?? "Nelayan",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95"
                >
                  <Navigation size={12} /> Pandu Rute SAR
                </button>
              )}
              <a
                href="tel:115"
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                <Phone size={12} /> Basarnas 115
              </a>
            </div>
          </div>
        ) : (
          /* Tampilan Standar Radar */
          <div className="flex gap-2">
            {isShared ? (
              <button
                onClick={() =>
                  onUnshare(member.userId, member.userName ?? "Nelayan")
                }
                className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
              >
                Cabut Akses
              </button>
            ) : (
              <button
                onClick={() =>
                  onShare(member.userId, member.userName ?? "Nelayan")
                }
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Bagikan Lokasi
              </button>
            )}
            <button
              onClick={onSendSOS}
              className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
            >
              <AlertTriangle size={13} /> SOS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
