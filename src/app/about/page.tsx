"use client";

import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'DM Sans','Geist',sans-serif",
        background: "#fafaf8",
        color: "#1a1a1a",
      }}
    >
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
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
              className="text-[14px] font-semibold text-slate-900 transition-colors"
            >
              About
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
              style={{ background: "linear-gradient(135deg,#059669,#0d9488)" }}
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        {/* Page Header — sama dengan terms/privacy */}
        <div className="mb-10 border-b border-slate-100 pb-8">
          <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-600 uppercase">
            Tentang Kami
          </p>
          <h1
            className="mb-3 text-[36px] font-black text-slate-900 md:text-[44px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Mendigitalisasi laut untuk
            <br />
            nelayan tradisional.
          </h1>
        </div>

        {/* Content — max-w-3xl agar teks tidak terlalu lebar */}
        <div className="max-w-3xl space-y-10">
          {/* Intro */}
          <p className="text-[17px] leading-relaxed text-slate-600">
            Laung lahir dari kesadaran bahwa nelayan tradisional di Indonesia
            seringkali melaut dengan metode &quot;tebak-tebakan&quot;.
            Ketergantungan pada intuisi tanpa data yang akurat berujung pada
            tingginya biaya bahan bakar dan risiko kegagalan tangkapan.
          </p>

          {/* Problem / Solution */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
              <h3 className="mb-3 text-[18px] font-black text-emerald-700">
                Masalah
              </h3>
              <p className="text-[15px] leading-relaxed text-slate-600">
                Nelayan harus menempuh jarak jauh tanpa kepastian lokasi ikan.
                Tingginya harga solar dan ketidakpastian kondisi cuaca menjadi
                beban ekonomi yang terus menekan kehidupan nelayan kecil.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-900 p-7 text-emerald-50">
              <h3 className="mb-3 text-[18px] font-black text-white">
                Solusi Kami
              </h3>
              <p className="text-[15px] leading-relaxed">
                Laung menghadirkan akses demokratis terhadap data satelit NASA.
                Kami menyederhanakan data oseanografi yang rumit menjadi
                &quot;skor lokasi&quot; yang mudah dibaca, membantu nelayan
                menentukan arah dengan lebih efisien, hemat, dan aman.
              </p>
            </div>
          </div>

          {/* Vision */}
          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              Visi Kami
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-600">
              Kami percaya bahwa teknologi seharusnya menjadi alat yang
              memberdayakan, bukan menjauhkan. Laung berkomitmen untuk tetap
              menjadi platform yang ringan, dapat diakses di perangkat sederhana
              (PWA), dan berorientasi pada kemudahan pengguna.
            </p>
          </section>

          {/* Founder */}
          <section className="border-t border-slate-100 pt-10">
            <h2
              className="mb-6 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              Pengembang
            </h2>
            <div className="flex items-center gap-4">
              <Image
                className="h-12 w-12 rounded-full object-cover"
                src="/me.jpg"
                width={100}
                height={100}
                alt="developer"
              />
              <div>
                <p className="font-black text-slate-900">Joan Orlando Purba</p>
                <p className="text-[14px] text-slate-500">
                  Pengembang
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white py-12 text-center">
        <div className="flex justify-center gap-6 text-[13px] font-bold text-slate-400">
          <Link href="/terms" className="hover:text-emerald-600">
            Syarat & Ketentuan
          </Link>
          <Link href="/privacy" className="hover:text-emerald-600">
            Kebijakan Privasi
          </Link>
          <Link href="/about" className="hover:text-emerald-600">
            Tentang Kami
          </Link>
        </div>
        <p className="mt-6 text-[12px] text-slate-400">
          © 2026 Laung · Dibuat dengan semangat untuk laut Indonesia.
        </p>
      </footer>
    </div>
  );
}
