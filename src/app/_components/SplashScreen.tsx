"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"wave" | "logo" | "tagline" | "out">(
    "wave",
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 600);
    const t2 = setTimeout(() => setPhase("tagline"), 1400);
    const t3 = setTimeout(() => setPhase("out"), 2800);
    const t4 = setTimeout(() => onComplete(), 3400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #022c22 0%, #064e3b 40%, #065f46 70%, #047857 100%)",
        opacity: phase === "out" ? 0 : 1,
        transform: phase === "out" ? "scale(1.04)" : "scale(1)",
        transition:
          phase === "out"
            ? "opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)"
            : "none",
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Animated wave rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-emerald-400/20"
            style={{
              width: `${180 + i * 90}px`,
              height: `${180 + i * 90}px`,
              opacity:
                phase === "wave" || phase === "logo" || phase === "tagline"
                  ? 1
                  : 0,
              animation: `ripple 3s ease-out ${i * 0.35}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Glowing center blob */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: "280px",
          height: "280px",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
          filter: "blur(32px)",
        }}
      />

      {/* Wave SVG bottom */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0"
        style={{
          opacity: phase === "wave" ? 0 : 1,
          transform: phase === "wave" ? "translateY(20px)" : "translateY(0)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <svg
          viewBox="0 0 375 120"
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: "120px" }}
        >
          <path
            d="M0,60 C60,20 120,100 187,60 C254,20 314,100 375,60 L375,120 L0,120 Z"
            fill="rgba(4,120,87,0.25)"
          />
          <path
            d="M0,80 C80,40 140,110 220,75 C290,45 340,100 375,70 L375,120 L0,120 Z"
            fill="rgba(5,150,105,0.15)"
          />
        </svg>
      </div>

      {/* Logo + app name */}
      <div
        className="relative flex flex-col items-center gap-4"
        style={{
          opacity: phase === "wave" ? 0 : 1,
          transform:
            phase === "wave"
              ? "translateY(24px) scale(0.92)"
              : "translateY(0) scale(1)",
          transition:
            "opacity 0.7s cubic-bezier(0.34,1.56,0.64,1), transform 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-[28px] shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(12px)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <Image
            src="/icon.svg"
            width={48}
            height={48}
            alt="Laung icon"
            className="h-12 w-12"
          />
        </div>

        <div className="text-center">
          <h1
            className="text-4xl font-black tracking-tight text-white"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "-0.04em",
              textShadow: "0 2px 20px rgba(0,0,0,0.4)",
            }}
          >
            Laung
          </h1>
        </div>
      </div>

      {/* Tagline */}
      <div
        className="relative mt-3 text-center"
        style={{
          opacity: phase === "tagline" || phase === "out" ? 1 : 0,
          transform:
            phase === "tagline" || phase === "out"
              ? "translateY(0)"
              : "translateY(10px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <p
          className="text-[13px] font-semibold tracking-[0.2em] text-emerald-300/80 uppercase"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Untuk Pelaut
        </p>
      </div>

      {/* Loading dots */}
      <div
        className="absolute bottom-14 flex items-center gap-1.5"
        style={{
          opacity: phase === "tagline" ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-emerald-400/60"
            style={{
              animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
