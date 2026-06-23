import { AlertTriangle, X } from "lucide-react";
import type { FleetMember } from "~/hooks/useFleetTracking";

interface MemberDetailCardProps {
  member: FleetMember;
  isShared: boolean;
  onClose: () => void;
  onShare: (userId: string, userName: string) => void;
  onUnshare: (userId: string, userName: string) => void;
  onSendSOS: () => void;
}

export default function MemberDetailCard({
  member,
  isShared,
  onClose,
  onShare,
  onUnshare,
  onSendSOS,
}: MemberDetailCardProps) {
  return (
    <div className="animate-in fade-in slide-in-from-top-4 absolute top-24 right-4 left-4 z-30 max-w-sm duration-200 sm:mx-auto">
      <div
        className="w-full rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${member.isSOS ? "animate-ping bg-red-500" : "bg-blue-500"}`}
            />
            <h4 className="text-sm font-black text-slate-800">
              {member.userName ?? "Nelayan"}
              {member.isSOS && (
                <span className="ml-1 text-xs font-extrabold text-red-600">
                  (DARURAT)
                </span>
              )}
            </h4>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          {isShared ? (
            <button
              onClick={() =>
                onUnshare(member.userId, member.userName ?? "Nelayan")
              }
              className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600"
            >
              Cabut Akses Lokasi
            </button>
          ) : (
            <button
              onClick={() =>
                onShare(member.userId, member.userName ?? "Nelayan")
              }
              className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white"
            >
              Bagikan Lokasiku
            </button>
          )}
          <button
            onClick={onSendSOS}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-600 py-2 text-xs font-black text-white"
          >
            <AlertTriangle size={14} /> SOS
          </button>
        </div>
      </div>
    </div>
  );
}
