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
    <div className="mx-3 flex justify-between">
      <div className="flex flex-col items-start gap-3">
        <button
          onClick={onSendSOS}
          className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-[12px] font-black text-white shadow-lg ring-2 shadow-red-500/40 ring-red-500/20 transition-all hover:bg-red-700 active:scale-95"
        >
          <AlertTriangle size={14} /> DARURAT SOS
        </button>
      </div>
      <div className="flex flex-col items-end gap-3">
        <button
          onClick={onToggleSharing}
          className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-black shadow-lg transition-all active:scale-95 ${
            isSharing
              ? "bg-emerald-500 text-white shadow-emerald-200"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          {isSharing ? <UserCheck size={14} /> : <Users size={14} />}
          {isSharing ? "Lobi Armada Aktif" : "Bagikan Lokasi"}
        </button>
      </div>
    </div>
  );
}
