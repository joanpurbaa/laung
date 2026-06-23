import { AlertTriangle } from "lucide-react";
import type { ConfirmDialogState } from "~/types/type";

interface ConfirmDialogProps {
  dialog: ConfirmDialogState;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmDialog({
  dialog,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="animate-in fade-in absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-md duration-200">
      <div className="scale-in-95 mx-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
          {dialog.type === "danger" && (
            <AlertTriangle size={20} className="text-red-500" />
          )}
          {dialog.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {dialog.message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-sm transition active:scale-95 ${
              dialog.type === "danger"
                ? "bg-red-500 shadow-red-200 hover:bg-red-600"
                : "bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600"
            }`}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
