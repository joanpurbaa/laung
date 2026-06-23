import type { GeoSpot } from "~/types/map";
import { getScoreLabel } from "~/types/utils";

interface BottomSheetExpandedProps {
  selectedSpot: GeoSpot | null;
  loading: boolean;
  gpsActive: boolean;
  userLocation: { lat: number; lng: number } | null;
  distance: number;
  traditionalFuel: number;
  zppiFuel: number;
  fuelSavingPercent: number;
  showDetail: boolean;
  onToggleDetail: () => void;
  topSpots: GeoSpot[];
  onSelectSpot: (spot: GeoSpot) => void;
  onCollapse: () => void;
}

export default function BottomSheetExpanded({
  selectedSpot,
  loading,
  gpsActive,
  userLocation,
  distance,
  traditionalFuel,
  zppiFuel,
  fuelSavingPercent,
  showDetail,
  onToggleDetail,
  topSpots,
  onSelectSpot,
  onCollapse,
}: BottomSheetExpandedProps) {
  const scoreInfo = selectedSpot ? getScoreLabel(selectedSpot.value) : null;

  return (
    <div className="mx-3 overflow-hidden rounded-3xl border border-white/60 bg-white/97 shadow-2xl backdrop-blur-md">
      <button
        onClick={onCollapse}
        className="flex w-full flex-col items-center pt-3 pb-1"
      >
        <div className="h-1 w-10 rounded-full bg-slate-200" />
      </button>

      {selectedSpot ? (
        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-md"
              style={{ backgroundColor: scoreInfo?.color }}
            >
              <span className="text-2xl leading-none font-black">
                {selectedSpot.value}
              </span>
              <span className="text-[8px] leading-none font-bold uppercase opacity-80">
                / 100
              </span>
            </div>
            <div className="flex-1">
              <span
                className="inline-block rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider text-white uppercase"
                style={{ backgroundColor: scoreInfo?.color }}
              >
                {scoreInfo?.label}
              </span>
              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                {selectedSpot.lat.toFixed(4)}, {selectedSpot.lng.toFixed(4)}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                {gpsActive
                  ? "📍 Dihitung dari posisi GPS kamu"
                  : "⏳ Menunggu sinyal GPS…"}
              </p>
            </div>
            <button
              onClick={onToggleDetail}
              className={`rounded-xl border px-3 py-2 text-[10px] font-black tracking-wider uppercase transition-colors ${
                showDetail
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {showDetail ? "Tutup" : "Detail"}
            </button>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-50 p-2.5 text-center">
              <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                Jarak
              </p>
              <p className="text-base font-black text-slate-800">
                {userLocation ? distance.toFixed(1) : "—"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400">Km</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-2.5 text-center">
              <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                Waktu
              </p>
              <p className="text-base font-black text-slate-800">
                {userLocation ? Math.round(distance * 3.2) : "—"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400">Menit</p>
            </div>
            <div className="rounded-2xl bg-emerald-500 p-2.5 text-center shadow-sm shadow-emerald-200">
              <p className="text-[9px] font-bold tracking-wider text-emerald-100 uppercase">
                Hemat BBM
              </p>
              <p className="text-base font-black text-white">
                {userLocation ? `${fuelSavingPercent}%` : "—"}
              </p>
              <p className="text-[9px] font-semibold text-emerald-200">Solar</p>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <div className="text-center">
              <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                Metode Acak
              </p>
              <p className="text-sm font-black text-red-400 line-through">
                {traditionalFuel} L
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <div className="h-px w-6 bg-slate-200" />
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              <div className="h-px w-6 bg-slate-200" />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                Rute ZPPI
              </p>
              <p className="text-sm font-black text-emerald-600">
                {zppiFuel} L
              </p>
            </div>
          </div>

          {showDetail && selectedSpot.breakdown && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Analisis Multi-Kriteria
              </p>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      🌿 Klorofil-a (
                      {selectedSpot.breakdown.chlorValue.toFixed(2)} mg/m³)
                    </span>
                    <span className="text-[11px] font-black text-emerald-600">
                      +{selectedSpot.breakdown.chlorCont} pts
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${selectedSpot.breakdown.chlorCont}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      🌡️ Suhu Permukaan (
                      {selectedSpot.breakdown.sstValue.toFixed(1)} °C)
                    </span>
                    <span className="text-[11px] font-black text-blue-600">
                      +{selectedSpot.breakdown.sstCont} pts
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${selectedSpot.breakdown.sstCont}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      🌊 Kontribusi Pasut Alami
                    </span>
                    <span className="text-[11px] font-black text-cyan-600">
                      +{selectedSpot.breakdown.tideCont} pts
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${selectedSpot.breakdown.tideCont}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showDetail && (
            <div>
              <p className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Top Spot Lainnya
              </p>
              <div className="flex gap-2">
                {topSpots.map((spot, i) => {
                  const isActive =
                    selectedSpot?.lat === spot.lat &&
                    selectedSpot?.lng === spot.lng;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectSpot(spot)}
                      className={`flex flex-1 flex-col items-center rounded-2xl border py-2 transition-all ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                        Spot {String.fromCharCode(65 + i)}
                      </span>
                      <span
                        className="text-sm font-black"
                        style={{ color: getScoreLabel(spot.value).color }}
                      >
                        {spot.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pb-4 text-center text-sm text-slate-400">
          {loading ? "Memuat data ZPPI..." : "Pilih titik pada peta"}
        </div>
      )}
    </div>
  );
}
