"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar2() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled ? "px-4 py-2 md:px-8" : "px-0 py-0"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-6xl flex-col backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "rounded-2xl bg-white/60 px-3 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)]"
            : "border-b border-slate-100/80 bg-white/70"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icon.svg"
              width={26}
              height={26}
              alt="Laung"
              className="rounded-lg"
            />
            <span className="text-[16px] font-black tracking-[-0.03em] text-slate-900">
              Laung
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/#cara-kerja"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Cara Kerja
            </Link>
            <Link
              href="/about"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
            >
              Privacy
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden text-[13px] font-bold text-slate-500 transition-colors hover:text-slate-800 md:block"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-xl px-4 py-2 text-[13px] font-black text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg,#059669,#0d9488)",
              }}
            >
              Daftar Gratis
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 flex h-8 w-8 flex-col items-center justify-center gap-[5px] rounded-lg transition-colors hover:bg-slate-100 md:hidden"
              aria-label="Toggle menu"
            >
              <span
                className={`block h-[2px] w-4.5 rounded-full bg-slate-700 transition-all duration-300 ${
                  mobileOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-4.5 rounded-full bg-slate-700 transition-all duration-300 ${
                  mobileOpen ? "scale-x-0 opacity-0" : ""
                }`}
              />
              <span
                className={`block h-[2px] w-4.5 rounded-full bg-slate-700 transition-all duration-300 ${
                  mobileOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
            mobileOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-0.5 border-t border-slate-100 px-5 pt-3 pb-4">
            {[
              { href: "/#cara-kerja", label: "Cara Kerja" },
              { href: "/about", label: "About" },
              { href: "/terms", label: "Terms" },
              { href: "/privacy", label: "Privacy" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-slate-100 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
              >
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
