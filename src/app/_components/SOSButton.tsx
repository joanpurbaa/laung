"use client";

import { useState, useRef } from "react";
import { AlertTriangle, X, CheckCircle } from "lucide-react";
import { sendSOSAction, resolveSOSAction } from "~/lib/actions/location";

type SOSState = "idle" | "confirm" | "sending" | "active" | "resolving";

export default function SOSButton() {
  const [state, setState] = useState<SOSState>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null  >(null);

  const handleHoldStart = () => {
    if (state === "active") return;
    let progress = 0;
    progressRef.current = setInterval(() => {
      progress += 100 / 30;
      setHoldProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(progressRef.current!);
        setState("confirm");
        setHoldProgress(0);
      }
    }, 100);
  };

  const handleHoldEnd = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (state !== "confirm") setHoldProgress(0);
  };

  const handleConfirmSOS = async () => {
    setState("sending");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await sendSOSAction({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          message: "Butuh bantuan segera!",
        });
        setState("active");
      },
      () => {
        // Fallback tanpa koordinat akurat
        sendSOSAction({ latitude: 0, longitude: 0 }).catch(console.error);
        setState("active");
      },
      { timeout: 5000 },
    );
  };

  const handleResolve = async () => {
    setState("resolving");
    await resolveSOSAction();
    setState("idle");
  };

  if (state === "active") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-200">
          <AlertTriangle size={32} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[11px] font-black tracking-wider text-red-600 uppercase">
          SOS Aktif — Bantuan Dipanggil
        </p>
        <button
          onClick={() => void handleResolve()}
          disabled={state === "resolving"}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-black text-emerald-700 transition-all active:scale-95"
        >
          <CheckCircle size={14} />
          Saya Sudah Aman
        </button>
      </div>
    );
  }

  if (state === "confirm") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-[13px] font-black text-red-700">
            Kirim sinyal SOS?
          </p>
          <p className="mt-1 text-[11px] font-medium text-red-500">
            Nelayan terdekat dalam radius 50km akan diberitahu.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void handleConfirmSOS()}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-[13px] font-black text-white shadow-lg shadow-red-200 active:scale-95"
          >
            <AlertTriangle size={14} />
            Ya, Kirim SOS
          </button>
          <button
            onClick={() => setState("idle")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-500 active:scale-95"
          >
            <X size={14} />
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Progress ring saat hold */}
        {holdProgress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            width="80"
            height="80"
            viewBox="0 0 80 80"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeDasharray={`${holdProgress * 2.26} 226`}
              strokeLinecap="round"
            />
          </svg>
        )}
        <button
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          disabled={state === "sending"}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-200 bg-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
          style={{
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
          }}
        >
          <AlertTriangle
            size={28}
            className={holdProgress > 0 ? "text-red-500" : "text-red-400"}
            strokeWidth={2.5}
          />
        </button>
      </div>
      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {state === "sending" ? "Mengirim..." : "Tahan 3 detik untuk SOS"}
      </p>
    </div>
  );
}
