"use client";

import Link from "next/link";
import Image from "next/image";

const LAST_UPDATED = "10 Juni 2026";
const TEAM_NAME = "Joan Orlando Purba";

export default function PrivacyPolicy() {
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
              className="text-[14px] font-semibold text-slate-900 transition-colors"
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
        {/* Page Header */}
        <div className="mb-10 border-b border-slate-100 pb-8">
          <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-600 uppercase">
            Dokumen Legal
          </p>
          <h1
            className="mb-3 text-[36px] font-black text-slate-900 md:text-[44px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Kebijakan Privasi
          </h1>
          <p className="text-[14px] font-medium text-slate-400">
            Terakhir diperbarui: {LAST_UPDATED}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl space-y-10 text-[15px] leading-relaxed text-slate-600">
          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              1. Komitmen Privasi
            </h2>
            <p>
              Kami di Laung sangat menghargai privasi pengguna. Kebijakan ini
              menjelaskan bagaimana kami mengumpulkan, menggunakan, dan
              melindungi data pribadi Anda saat menggunakan platform kami untuk
              membantu aktivitas penangkapan ikan Anda.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              2. Informasi yang Kami Kumpulkan
            </h2>
            <ul className="space-y-2 pl-5">
              {[
                "Data Akun: Nama, alamat email, dan informasi autentikasi.",
                "Data Lokasi: Akses GPS untuk memberikan rekomendasi spot ikan yang relevan.",
                "Data Penggunaan: Histori pencarian dan interaksi dalam aplikasi untuk pengembangan fitur.",
                "Informasi Perangkat: Data teknis untuk memastikan kompatibilitas PWA.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
            <h2
              className="mb-4 text-[20px] font-black text-emerald-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              3. Penggunaan Data Lokasi
            </h2>
            <p className="text-emerald-800">
              Aplikasi ini mengakses lokasi Anda{" "}
              <strong>hanya untuk keperluan layanan</strong> (menentukan spot
              ikan terdekat). Data lokasi Anda tidak diperjualbelikan kepada
              pihak ketiga. Kami menggunakan data ini semata-mata untuk
              meningkatkan akurasi rekomendasi yang Anda terima.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              4. Berbagi Data dengan Pihak Ketiga
            </h2>
            <p>
              Kami tidak menjual data pribadi Anda. Kami mungkin membagikan data
              agregat yang tidak teridentifikasi secara personal untuk tujuan
              penelitian atau analitik pengembangan sistem. Kami juga
              menggunakan penyedia layanan pihak ketiga (seperti database
              Supabase) yang memiliki standar keamanan tinggi untuk melindungi
              data Anda.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              5. Hak Pengguna
            </h2>
            <p>Anda berhak untuk:</p>
            <ul className="mt-3 space-y-2 pl-5">
              {[
                "Meminta akses ke data pribadi yang kami simpan tentang Anda.",
                "Meminta penghapusan data atau penutupan akun Anda.",
                "Menarik persetujuan penggunaan lokasi kapan saja melalui pengaturan perangkat Anda.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:justify-between">
          <p className="text-[13px] font-medium text-slate-400">
            © {new Date().getFullYear()} Laung · {TEAM_NAME}
          </p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-[13px] font-bold text-emerald-600 hover:underline"
            >
              ← Syarat & Ketentuan
            </Link>
            <Link
              href="/"
              className="text-[13px] font-semibold text-slate-400 hover:text-slate-600"
            >
              Beranda
            </Link>
          </div>
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
