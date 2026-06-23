"use client";

import Link from "next/link";
import Navbar2 from "../_components/Navbar2";
import ChatbotPopup from "../_components/ChatbotPopup";

const LAST_UPDATED = "10 Juni 2026";
const CONTACT_EMAIL = "joanpurba562@gmail.com";
const TEAM_NAME = "Joan Orlando Purba";
const APP_URL = "https://laung-id.vercel.app";

export default function Terms() {
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'DM Sans','Geist',sans-serif",
        background: "#fafaf8",
        color: "#1a1a1a",
      }}
    >
      <Navbar2 />
      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="mb-10 border-b border-slate-100 pb-8">
          <p className="mb-2 text-[11px] font-black tracking-[0.14em] text-emerald-600 uppercase">
            Dokumen Legal
          </p>
          <h1
            className="mb-3 text-[36px] font-black text-slate-900 md:text-[44px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Syarat & Ketentuan
          </h1>
          <p className="text-[14px] font-medium text-slate-400">
            Terakhir diperbarui: {LAST_UPDATED}
          </p>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[13px] font-bold text-amber-700">
              ⚠️ Catatan Penting
            </p>
            <p className="mt-1 text-[13px] leading-relaxed font-medium text-amber-600">
              Aplikasi Laung saat ini berstatus <strong>prototipe / MVP</strong>{" "}
              yang dikembangkan untuk tujuan penelitian dan kompetisi inovasi.
              Fitur dan layanan dapat berubah sewaktu-waktu tanpa pemberitahuan
              sebelumnya.
            </p>
          </div>
        </div>

        <div className="max-w-3xl space-y-10 text-[15px] leading-relaxed text-slate-600">
          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              1. Penerimaan Syarat
            </h2>
            <p>
              Dengan mengakses atau menggunakan aplikasi Laung melalui {APP_URL}{" "}
              maupun sebagai Progressive Web App (PWA) yang terinstal di
              perangkat Anda, Anda menyatakan telah membaca, memahami, dan
              menyetujui seluruh Syarat & Ketentuan ini.
            </p>
            <p className="mt-3">
              Jika Anda tidak menyetujui syarat-syarat ini, mohon hentikan
              penggunaan aplikasi. Penggunaan berkelanjutan setelah pembaruan
              syarat dianggap sebagai persetujuan terhadap perubahan tersebut.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              2. Deskripsi Layanan
            </h2>
            <p>
              Laung adalah aplikasi berbasis web (PWA) yang menyediakan
              informasi rekomendasi zona potensi penangkapan ikan (ZPPI)
              berdasarkan data oseanografi satelit. Layanan meliputi:
            </p>
            <ul className="mt-3 space-y-2 pl-5">
              {[
                "Visualisasi data klorofil-a, suhu permukaan laut (SST), dan pasang surut dari sumber data publik NASA/MODIS",
                "Sistem skoring ZPPI berbasis algoritma Decision Support System (DSS)",
                "Fitur histori pencatatan hasil tangkapan ikan",
                "Informasi cuaca maritim dan kondisi laut terkini",
                "Autentikasi pengguna untuk penyimpanan data personal",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-red-100 bg-red-50 p-6">
            <h2
              className="mb-4 text-[20px] font-black text-red-800"
              style={{ letterSpacing: "-0.02em" }}
            >
              3. Disclaimer Akurasi Data & Rekomendasi
            </h2>
            <p className="mb-3 text-[14px] font-semibold text-red-700">
              Harap baca bagian ini dengan seksama sebelum menggunakan aplikasi
              Laung.
            </p>
            <ul className="space-y-2.5 pl-5 text-[14px] text-red-700">
              {[
                "Seluruh rekomendasi spot penangkapan ikan yang ditampilkan oleh Laung bersifat INDIKATIF dan TIDAK MENJAMIN keberhasilan tangkapan ikan.",
                "Data yang digunakan bersumber dari citra satelit publik (NASA AQUA MODIS) dengan resolusi dan frekuensi pembaruan terbatas. Data tersebut dapat mengandung ketidakakuratan akibat tutupan awan, kondisi atmosfer, atau keterlambatan pembaruan.",
                "Skor ZPPI merupakan hasil kalkulasi algoritma yang disederhanakan dan tidak menggantikan pengalaman, pengetahuan lokal, serta penilaian langsung nelayan di lapangan.",
                "Laung tidak bertanggung jawab atas kerugian finansial, waktu, bahan bakar, atau sumber daya lainnya yang timbul akibat penggunaan rekomendasi dari aplikasi ini.",
                "Kondisi laut aktual dapat berbeda signifikan dari data satelit karena faktor musim, cuaca ekstrem, dan dinamika oseanografi lokal yang tidak tertangkap oleh sensor satelit.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
            <h2
              className="mb-4 text-[20px] font-black text-orange-800"
              style={{ letterSpacing: "-0.02em" }}
            >
              4. Tanggung Jawab Keselamatan di Laut
            </h2>
            <p className="mb-3 text-[14px] font-semibold text-orange-700">
              Keselamatan jiwa adalah prioritas utama. Laung TIDAK dapat
              menggantikan prosedur keselamatan berlayar.
            </p>
            <ul className="space-y-2.5 pl-5 text-[14px] text-orange-700">
              {[
                "Pengguna sepenuhnya bertanggung jawab atas keputusan untuk berlayar, termasuk menilai kondisi cuaca, keamanan kapal, dan kesiapan awak secara mandiri.",
                "Selalu periksa informasi cuaca resmi dari BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) sebelum berangkat melaut. Data cuaca di Laung bersifat estimasi dan tidak menggantikan prakiraan resmi.",
                "Wajib mematuhi seluruh peraturan keselamatan berlayar yang ditetapkan oleh otoritas terkait (Syahbandar, Dinas Perikanan, BASARNAS, dll).",
                "Laung tidak bertanggung jawab atas kecelakaan, cedera, kehilangan jiwa, atau kerusakan properti yang terjadi selama kegiatan berlayar dan menangkap ikan.",
                "Penggunaan aplikasi di perairan berbahaya, saat cuaca buruk, atau dalam kondisi yang tidak aman sepenuhnya menjadi risiko pengguna.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              5. Kewajiban & Larangan Pengguna
            </h2>
            <p className="mb-3">
              Dengan menggunakan Laung, Anda menyatakan dan menjamin bahwa:
            </p>
            <ul className="space-y-2 pl-5">
              {[
                "Anda berusia minimal 17 tahun atau mendapat persetujuan orang tua/wali",
                "Data yang Anda daftarkan (nama, email) adalah informasi yang benar dan akurat",
                "Anda tidak akan menggunakan aplikasi untuk tujuan ilegal atau merugikan pihak lain",
                "Anda tidak akan mencoba meretas, memanipulasi, atau merusak sistem aplikasi",
                "Anda tidak akan menyebarkan informasi yang menyesatkan berdasarkan data dari aplikasi ini",
                "Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              6. Batasan Tanggung Jawab (Limitation of Liability)
            </h2>
            <p className="mb-3">
              Sejauh diizinkan oleh hukum yang berlaku di Republik Indonesia,
              tim pengembang Laung tidak bertanggung jawab atas:
            </p>
            <ul className="space-y-2 pl-5">
              {[
                "Kerugian langsung, tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan aplikasi",
                "Kehilangan data, pendapatan, tangkapan, atau peluang bisnis akibat ketidakakuratan rekomendasi",
                "Gangguan layanan, downtime server, atau ketidaktersediaan aplikasi",
                "Kesalahan atau ketidakakuratan dalam data pihak ketiga (NASA, Open-Meteo, OpenStreetMap) yang digunakan oleh aplikasi",
                "Kerugian akibat akses tidak sah ke akun pengguna yang disebabkan oleh kelalaian pengguna",
                "Perubahan fitur, penghentian layanan, atau modifikasi aplikasi sewaktu-waktu",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-slate-100 p-3 text-[13px] font-medium text-slate-500">
              Aplikasi ini disediakan &quot;sebagaimana adanya&quot; (
              <em>as-is</em>) tanpa jaminan apapun, tersurat maupun tersirat.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              7. Hak Kekayaan Intelektual
            </h2>
            <p>
              Seluruh konten aplikasi Laung — termasuk namun tidak terbatas pada
              desain antarmuka, logo, algoritma scoring ZPPI, teks, dan kode
              sumber — merupakan milik pengembang dan dilindungi oleh hukum hak
              kekayaan intelektual yang berlaku.
            </p>
            <p className="mt-3">
              Data oseanografi yang digunakan berasal dari sumber publik (NASA
              AQUA MODIS, Open-Meteo, OpenStreetMap) dan tunduk pada lisensi
              masing-masing penyedia data.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              8. Perubahan Layanan & Syarat
            </h2>
            <p>
              Kami berhak mengubah, menangguhkan, atau menghentikan seluruh atau
              sebagian layanan kapan saja tanpa pemberitahuan. Kami juga berhak
              memperbarui Syarat & Ketentuan ini sewaktu-waktu. Versi terbaru
              selalu tersedia di halaman ini.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              9. Hukum yang Berlaku
            </h2>
            <p>
              Syarat & Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan
              hukum Republik Indonesia. Segala sengketa yang timbul akan
              diselesaikan secara musyawarah mufakat, dan jika tidak tercapai
              kesepakatan, akan diselesaikan melalui jalur hukum yang berlaku di
              Indonesia.
            </p>
          </section>

          <section>
            <h2
              className="mb-4 text-[20px] font-black text-slate-900"
              style={{ letterSpacing: "-0.02em" }}
            >
              10. Hubungi Kami
            </h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai Syarat & Ketentuan ini,
              silakan hubungi kami:
            </p>
            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-bold text-slate-800">{TEAM_NAME}</p>
              <p className="text-[14px] text-slate-500">
                Email: {CONTACT_EMAIL}
              </p>
              <p className="text-[14px] text-slate-500">Website: {APP_URL}</p>
            </div>
          </section>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:justify-between">
          <p className="text-[13px] font-medium text-slate-400">
            © {new Date().getFullYear()} Laung · {TEAM_NAME}
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-[13px] font-bold text-emerald-600 hover:underline"
            >
              Kebijakan Privasi →
            </Link>
            <Link
              href="/"
              className="text-[13px] font-semibold text-slate-400 hover:text-slate-600"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

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

      <ChatbotPopup />
    </div>
  );
}
