import { AlertTriangle, UserCheck, Users } from "lucide-react";

interface ActionButtonsProps {
  isSharing: boolean;
  onSendSOS: () => void;
  onToggleSharing: () => void;
}

export default function ActionButtons({
  isSharing,
  onSendSOS,
  onToggleSharing,
}: ActionButtonsProps) {
  return (
    <div className="mx-2.5 flex items-center justify-between gap-2">
      {/* Tombol SOS Darurat */}
      <button
        onClick={onSendSOS}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition-all"
      >
        <AlertTriangle size={14} />
        <span>Lapor Darurat (SOS)</span>
      </button>

      {/* Tombol Lobi / Bagikan Lokasi */}
      <button
        onClick={onToggleSharing}
        className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold shadow-sm transition-all active:scale-95 ${
          isSharing
            ? "border border-emerald-400 bg-emerald-500 text-white"
            : "border border-slate-200/90 bg-white/95 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {isSharing ? <UserCheck size={14} /> : <Users size={14} />}
        <span>{isSharing ? "Armada Aktif" : "Radar Armada"}</span>
      </button>
    </div>
  );
}
