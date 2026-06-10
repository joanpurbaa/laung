<div align="center">

<img src="public/icon.svg" width="72" height="72" alt="Laung Logo" />

# Laung 🎣

**Temukan spot mancing terbaik pakai data satelit.**

Aplikasi peta nelayan berbasis data oseanografi NASA — menampilkan klorofil laut, suhu permukaan, dan pasang surut secara real-time untuk membantu nelayan Indonesia pulang dengan hasil lebih banyak.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-059669?style=flat-square)](LICENSE)

[Demo →](https://laung-id.vercel.app) · [Laporkan Bug](https://github.com/joanpurbaa/laung/issues) · [Request Fitur](https://github.com/joanpurbaa/laung/issues)

</div>

---

## Tentang Laung

Nelayan Indonesia sering menghabiskan solar berlebih hanya untuk mencari ikan yang letaknya tidak pasti. **Laung** hadir sebagai solusi — membaca data satelit NASA AQUA MODIS dan menerjemahkannya menjadi peta visual yang sederhana: titik hijau berarti ikan banyak, berangkat ke sana.

```
Laut terbaca dari atas → Algoritma scoring → Rekomendasi spot + rute hemat solar
```

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🗺️ **Peta ZPPI Real-time** | Zona Potensi Penangkapan Ikan dari data satelit NASA, update harian |
| 🌡️ **SST & Klorofil** | Suhu permukaan laut dan konsentrasi klorofil divisualisasikan langsung di peta |
| 🐟 **Scoring per Spesies** | Algoritma menyesuaikan scoring untuk tongkol, tuna, kembung, dll |
| ⛽ **Kalkulasi Solar** | Estimasi konsumsi BBM otomatis — hemat hingga 40% per trip |
| 📡 **GPS Real-time** | Posisi nelayan live, jarak ke spot dihitung otomatis |
| 🌊 **Info Pasang Surut** | Kondisi air terkini untuk menentukan waktu terbaik melaut |
| 📱 **PWA — Offline Ready** | Install di HP tanpa App Store, berjalan tanpa sinyal di tengah laut |

---

## Stack Teknologi

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **Data Satelit** — NASA AQUA MODIS (klorofil, SST)
- **Maps** — Leaflet / Mapbox GL

---

## Memulai

### Prasyarat

- Node.js 18+
- npm / yarn / pnpm

### Instalasi

```bash
# Clone repo
git clone https://github.com/username/laung.git
cd laung

# Install dependencies
npm install

# Salin environment variables
cp .env.example .env.local
```

Isi `.env.local` dengan API key yang dibutuhkan:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NASA_EARTHDATA_TOKEN=your_nasa_token
```

### Menjalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Struktur Project

```
laung/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── home/           # Halaman peta utama
│   └── page.tsx        # Landing page
├── components/
│   ├── MapMockup.tsx
│   ├── OceanWave3D.tsx
│   └── ...
├── public/
│   └── icon.svg
└── ...
```

---

## Cara Kerja

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  NASA AQUA MODIS│────▶│  DSS Algorithm   │────▶│  Peta Nelayan   │
│  Klorofil · SST │     │  Weighted Scoring│     │  Skor per Spot  │
│  Resolusi 4km   │     │  3 Parameter     │     │  Rute + BBM     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

1. **Data masuk** — Klorofil, suhu permukaan, dan arus pasang surut diambil dari satelit NASA setiap hari
2. **Scoring** — Algoritma DSS memberi skor 0–100 untuk setiap titik di laut berdasarkan preferensi spesies target
3. **Visualisasi** — Titik berwarna (hijau = sangat baik, merah = rendah) tampil di peta
4. **Rekomendasi** — Sistem merekomendasikan spot terbaik + estimasi jarak dan konsumsi solar

---

## Dampak

> *"Dulu nebak-nebak. Sekarang langsung ke titiknya. Solar hemat, pulang lebih banyak ikan."*
> — Pak Slamet, Nelayan Karangampel · Cirebon

- **~40%** penghematan solar per trip
- **100+** spot terpetakan di perairan Laut Jawa
- **3** variabel oseanografi dianalisis secara bersamaan

---

## Kontribusi

Pull request sangat disambut! Untuk perubahan besar, buka issue terlebih dahulu untuk mendiskusikan apa yang ingin diubah.

```bash
# Buat branch baru
git checkout -b fitur/nama-fitur

# Commit perubahan
git commit -m "feat: tambah nama-fitur"

# Push ke branch
git push origin fitur/nama-fitur

# Buat Pull Request
```

---

## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat [`LICENSE`](LICENSE) untuk informasi lebih lanjut.

---

<div align="center">

Dibuat untuk nelayan Indonesia

[⬆ Kembali ke atas](#laung-)

</div>
