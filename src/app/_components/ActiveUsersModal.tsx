import { X } from "lucide-react";

interface ActiveUser {
  id: string;
  name: string;
}

interface ActiveUsersModalProps {
  activeUsersList: ActiveUser[];
  outgoingTargets: Set<string>;
  onClose: () => void;
  onShare: (userId: string, userName: string) => void;
  onUnshare: (userId: string, userName: string) => void;
}

export default function ActiveUsersModal({
  activeUsersList,
  outgoingTargets,
  onClose,
  onShare,
  onUnshare,
}: ActiveUsersModalProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-black text-slate-800">
            Lobi Nelayan Aktif
          </h4>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-slate-100"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {activeUsersList.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Belum ada nelayan lain di Lobi.
            </p>
          ) : (
            activeUsersList.map((user) => {
              const alreadyShared = outgoingTargets.has(user.id);
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 transition-colors ${alreadyShared ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100"}`}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      {user.name}
                    </p>
                    <p
                      className={`text-[10px] ${alreadyShared ? "font-semibold text-emerald-500" : "text-slate-400"}`}
                    >
                      {alreadyShared ? "✓ Akses diberikan" : "Belum ada akses"}
                    </p>
                  </div>

                  {alreadyShared ? (
                    <button
                      onClick={() => onUnshare(user.id, user.name)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
                    >
                      Cabut Akses
                    </button>
                  ) : (
                    <button
                      onClick={() => onShare(user.id, user.name)}
                      className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
                    >
                      Bagikan
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95"
        >
          Tutup Lobi
        </button>
      </div>
    </div>
  );
}
