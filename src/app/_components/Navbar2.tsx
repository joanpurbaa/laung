"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar2() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/icon.svg"
            width={26}
            height={26}
            alt="Laung"
            className="rounded-lg"
          />
          <span
            className="text-[16px] font-black text-slate-900"
            style={{ letterSpacing: "-0.03em" }}
          >
            Laung
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/#cara-kerja"
            className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            Cara Kerja
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
          <Link
            href="/about"
            className="text-[14px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            About
          </Link>
        </div>

        {/* CTA Buttons */}
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
            style={{ background: "linear-gradient(135deg,#059669,#0d9488)" }}
          >
            Daftar Gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}
