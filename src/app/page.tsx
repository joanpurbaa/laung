// src/app/page.tsx
import MapClient from "./_components/MapClient";

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-900">
      {/* Box Informasi & Legenda Melayang */}
      <div className="absolute top-4 left-4 z-[1000] max-w-xs rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        <h1 className="text-sm font-bold text-slate-800">ZPPI Peta Nelayan</h1>
        <p className="mb-3 text-xs text-slate-500">
          Wilayah Tangkap: Laut Jawa (Cirebon)
        </p>

        {/* Indikator Warna Klorofil */}
        <div className="space-y-1.5 border-t border-slate-100 pt-2">
          <p className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
            Densitas Plankton (Chlorophyll-a)
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-[#006837]" />
            <span>Sangat Tinggi (&gt; 1.0 mg/m³)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-[#31a354]" />
            <span>Tinggi (0.5 - 1.0 mg/m³)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-[#78c679]" />
            <span>Sedang (0.2 - 0.5 mg/m³)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-3 w-3 rounded-full bg-[#c2e699]" />
            <span>Rendah (&lt; 0.2 mg/m³)</span>
          </div>
        </div>
      </div>

      <MapClient />
    </main>
  );
}
