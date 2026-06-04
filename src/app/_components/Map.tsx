"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useCallback } from "react";
import type { ScoredSpot } from "~/lib/oceanScoring";

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LayerKey = "chlorophyll" | "nutrients" | "off";
type LoadStatus = "idle" | "loading" | "done" | "error";

const WMTS_BASE = "https://wmts.marine.copernicus.eu/teroWmts";

function buildWmtsUrl(layerId: string, style: string, time: string): string {
  return (
    `${WMTS_BASE}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0` +
    `&LAYER=${encodeURIComponent(layerId)}` +
    `&STYLE=${encodeURIComponent(style)}` +
    `&TILEMATRIXSET=EPSG%3A3857` +
    `&TILEMATRIX=EPSG%3A3857%3A{z}` +
    `&TILEROW={y}&TILECOL={x}` +
    `&FORMAT=image%2Fpng` +
    `&TIME=${encodeURIComponent(time)}`
  );
}

function getLatestDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0] + "T00:00:00.000Z";
}

const LAYER_CONFIGS: Record<
  Exclude<LayerKey, "off">,
  {
    label: string;
    layerId: string;
    style: string;
    unit: string;
  }
> = {
  chlorophyll: {
    label: "🌿 Chlorophyll-a",
    layerId:
      "GLOBAL_ANALYSISFORECAST_BGC_001_028/cmems_mod_glo_bgc-pft_anfc_0.25deg_P1D-m_202311/chl",
    style: "cmap:algae",
    unit: "mg/m³",
  },
  nutrients: {
    label: "🧪 Nutrien NO₃",
    layerId:
      "GLOBAL_ANALYSISFORECAST_BGC_001_028/cmems_mod_glo_bgc-nut_anfc_0.25deg_P1D-m_202311/no3",
    style: "cmap:matter",
    unit: "mmol/m³",
  },
};

function scoreColor(score: number) {
  if (score >= 80)
    return { stroke: "#22c55e", fill: "rgba(34,197,94,0.15)", text: "#4ade80" };
  if (score >= 65)
    return { stroke: "#eab308", fill: "rgba(234,179,8,0.15)", text: "#facc15" };
  return { stroke: "#f97316", fill: "rgba(249,115,22,0.12)", text: "#fb923c" };
}

function createSpotIcon(score: number, rank: number) {
  const c = scoreColor(score);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="50" viewBox="0 0 38 50">
    <defs><filter id="ds${rank}"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.55)"/></filter></defs>
    <path d="M19 2C11.82 2 6 7.82 6 15c0 9.5 13 33 13 33s13-23.5 13-33C32 7.82 26.18 2 19 2z"
      fill="${c.stroke}" filter="url(#ds${rank})"/>
    <circle cx="19" cy="15" r="9.5" fill="rgba(0,0,0,0.3)"/>
    <text x="19" y="19.5" text-anchor="middle" font-family="monospace" font-size="9.5" font-weight="700" fill="white">${rank}</text>
  </svg>`;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [38, 50],
    iconAnchor: [19, 50],
    popupAnchor: [0, -52],
  });
}

function StatBar({
  label,
  value,
  color,
  unit,
}: {
  label: string;
  value: number;
  color: string;
  unit: string;
}) {
  return (
    <div style={{ marginBottom: "9px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "3px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "11px",
            color,
            fontFamily: "monospace",
            fontWeight: 600,
          }}
        >
          {unit}
        </span>
      </div>
      <div
        style={{
          height: "3px",
          borderRadius: "2px",
          background: "rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(value, 100)}%`,
            borderRadius: "2px",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function ZoomToArea() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([
      [-7.0, 107.5],
      [-5.5, 109.3],
    ]);
  }, [map]);
  return null;
}

export default function Map() {
  const [spots, setSpots] = useState<ScoredSpot[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [activeLayer, setActiveLayer] = useState<LayerKey>("chlorophyll");
  const [opacity, setOpacity] = useState(0.7);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [, setFromCache] = useState(false);
  const [, setTtlRemaining] = useState(0);

  const latestDate = getLatestDate();

  const loadSpots = useCallback(async (forceRefresh = false) => {
    setStatus("loading");
    setSpots([]);
    setProgress(0);

    const timer = setInterval(
      () => setProgress((p) => Math.min(p + Math.random() * 9, 87)),
      800,
    );

    try {
      const options: RequestInit = forceRefresh
        ? { method: "POST" }
        : { method: "GET" };

      const endpoint = forceRefresh ? "/api/spots/refresh" : "/api/spots";
      const res = await fetch(endpoint, options);

      clearInterval(timer);
      setProgress(100);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        spots: ScoredSpot[];
        generatedAt: string;
        fromCache: boolean;
        ttlRemaining?: number;
      };

      setSpots(data.spots);
      setGeneratedAt(data.generatedAt);
      setFromCache(data.fromCache);
      setTtlRemaining(data.ttlRemaining ?? 0);
      setStatus("done");
    } catch {
      clearInterval(timer);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSpots();
  }, [loadSpots]);

  const overlayUrl =
    activeLayer !== "off"
      ? buildWmtsUrl(
          LAYER_CONFIGS[activeLayer].layerId,
          LAYER_CONFIGS[activeLayer].style,
          latestDate,
        )
      : null;

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .lp-wrap { border-radius: 14px !important; padding: 0 !important; overflow: hidden;
          background: transparent !important; box-shadow: 0 14px 44px rgba(0,0,0,0.55) !important;
          border: 1px solid rgba(255,255,255,0.09) !important; }
        .lp-content { margin: 0 !important; }
        .leaflet-popup-content-wrapper { border-radius: 14px !important; padding: 0 !important; overflow: hidden;
          background: transparent !important; box-shadow: 0 14px 44px rgba(0,0,0,0.55) !important;
          border: 1px solid rgba(255,255,255,0.09) !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: #091827 !important; }
        .gp { background: rgba(7,16,28,0.93); backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; color: white; }
        .lb { display: block; width: 100%; text-align: left; padding: 8px 11px; border-radius: 8px;
          cursor: pointer; font-size: 12px; font-weight: 500; font-family: 'DM Sans',sans-serif;
          transition: all 0.15s; border: 1px solid transparent; color: rgba(255,255,255,0.5); background: transparent; }
        .lb:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
        .lb.ac { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.3); color: #86efac; }
        .lb.an { background: rgba(251,191,36,0.09); border-color: rgba(251,191,36,0.28); color: #fcd34d; }
        .lb.ao { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.13); color: rgba(255,255,255,0.7); }
        input[type=range] { -webkit-appearance:none; width:100%; height:3px; border-radius:2px; outline:none; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:13px; height:13px; border-radius:50%; background:#22c55e; cursor:pointer; box-shadow:0 0 8px rgba(34,197,94,0.5); }
      `}</style>

      <MapContainer
        center={[-6.2, 108.4]}
        zoom={9}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia</a>'
        />

        {overlayUrl && (
          <TileLayer
            key={`${activeLayer}-${latestDate}`}
            url={overlayUrl}
            opacity={opacity}
            attribution='&copy; <a href="https://marine.copernicus.eu">Copernicus Marine</a>'
            tms={false}
          />
        )}

        {status === "done" &&
          spots.slice(0, 3).map((spot) => (
            <CircleMarker
              key={`ring-${spot.id}`}
              center={[spot.lat, spot.lng]}
              radius={18}
              pathOptions={{
                color: scoreColor(spot.score).stroke,
                fillColor: "transparent",
                fillOpacity: 0,
                weight: 1.5,
                opacity: 0.4,
              }}
            />
          ))}

        {status === "done" &&
          spots.map((spot, idx) => {
            const c = scoreColor(spot.score);
            return (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lng]}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                icon={createSpotIcon(spot.score, idx + 1)}
              >
                <Popup minWidth={248}>
                  <div
                    style={{
                      background:
                        "linear-gradient(155deg,#091827 0%,#0c2440 100%)",
                      padding: "18px",
                      minWidth: "248px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "15px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "9px",
                            color: "rgba(255,255,255,0.3)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          Fishing Spot #{idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "white",
                            marginTop: "3px",
                          }}
                        >
                          {spot.label}
                        </div>
                      </div>
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          background: c.fill,
                          border: `2px solid ${c.stroke}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "17px",
                            fontWeight: 700,
                            color: c.text,
                            fontFamily: "monospace",
                          }}
                        >
                          {spot.score}
                        </span>
                      </div>
                    </div>

                    <StatBar
                      label="🌿 Chlorophyll"
                      value={spot.scoreDetail.chlorophyll}
                      color="#22c55e"
                      unit={
                        spot.rawData.chlorophyll !== null
                          ? `${spot.rawData.chlorophyll.toFixed(2)} mg/m³`
                          : "estimasi"
                      }
                    />
                    <StatBar
                      label="🌡️ Suhu (SST)"
                      value={spot.scoreDetail.sst}
                      color="#f97316"
                      unit={
                        spot.rawData.sst !== null
                          ? `${spot.rawData.sst.toFixed(1)}°C`
                          : "estimasi"
                      }
                    />
                    <StatBar
                      label="🌊 Gelombang"
                      value={spot.scoreDetail.wave}
                      color="#38bdf8"
                      unit={
                        spot.rawData.waveHeight !== null
                          ? `${spot.rawData.waveHeight.toFixed(1)} m`
                          : "estimasi"
                      }
                    />
                    <StatBar
                      label="💨 Angin"
                      value={spot.scoreDetail.wind}
                      color="#c084fc"
                      unit={
                        spot.rawData.windSpeed !== null
                          ? `${spot.rawData.windSpeed.toFixed(1)} m/s`
                          : "estimasi"
                      }
                    />

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.35)",
                        fontFamily: "monospace",
                      }}
                    >
                      {Math.abs(spot.lat).toFixed(2)}°S &nbsp;{" "}
                      {spot.lng.toFixed(2)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        <ZoomToArea />
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <div
          className="gp"
          style={{
            padding: "9px 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>🐟</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700 }}>
              Peta Potensi Ikan — Laut Jawa
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.32)",
                letterSpacing: "0.05em",
              }}
            >
              Cirebon · Chlorophyll · SST · Gelombang · Angin
            </div>
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2000,
            background: "rgba(4,10,22,0.86)",
            backdropFilter: "blur(10px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "22px",
          }}
        >
          <div style={{ fontSize: "46px" }}>🛰️</div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              letterSpacing: "0.06em",
            }}
          >
            Menganalisis Data Oseanografi...
          </div>
          <div
            style={{
              width: "280px",
              height: "3px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.09)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg,#22c55e,#38bdf8)",
                borderRadius: "2px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            Chlorophyll (NASA ERDDAP) · SST · Gelombang · Angin (Open-Meteo)
            <br />
            Grid 0.25° · ~{Math.round(progress * 0.4)} titik diproses
          </div>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
          }}
        >
          <div
            className="gp"
            style={{
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>⚠️</span>
            <span style={{ fontSize: "12px", color: "#fca5a5" }}>
              Gagal memuat. Cek server log.
            </span>
            <button
              onClick={() => void loadSpots()}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {status === "done" && spots.length === 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
          }}
        >
          <div
            className="gp"
            style={{ padding: "14px 20px", textAlign: "center" }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "4px",
              }}
            >
              Tidak ada spot yang memenuhi threshold saat ini.
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
              Cek server console untuk debug log tiap titik grid.
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 80,
          right: 16,
          zIndex: 1000,
          width: "215px",
        }}
      >
        <div className="gp" style={{ padding: "14px" }}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.28)",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Overlay CMEMS
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              marginBottom: "14px",
            }}
          >
            <button
              className={`lb ${activeLayer === "chlorophyll" ? "ac" : ""}`}
              onClick={() => setActiveLayer("chlorophyll")}
            >
              🌿 Chlorophyll-a
            </button>
            <button
              className={`lb ${activeLayer === "off" ? "ao" : ""}`}
              onClick={() => setActiveLayer("off")}
            >
              ✕ Matikan Overlay
            </button>
          </div>
          {activeLayer !== "off" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.32)" }}
                >
                  Opacity
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                  }}
                >
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                style={{
                  background: `linear-gradient(to right,#22c55e ${opacity * 100}%,rgba(255,255,255,0.1) ${opacity * 100}%)`,
                }}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
              />
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.22)",
                  textAlign: "right",
                }}
              >
                📅{" "}
                {new Date(latestDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 16,
          zIndex: 1000,
          width: "208px",
        }}
      >
        <div className="gp" style={{ padding: "12px 14px" }}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.28)",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Skor Potensi
          </div>
          {[
            {
              color: "#22c55e",
              label: "≥ 80 — Potensi Tinggi",
              sub: "Ideal untuk melaut",
            },
            {
              color: "#eab308",
              label: "65–79 — Potensi Sedang",
              sub: "Kondisi cukup baik",
            },
            {
              color: "#f97316",
              label: "50–64 — Potensi Cukup",
              sub: "Perlu pertimbangan",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: "9px",
                marginBottom: "9px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                  marginTop: "3px",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.68)",
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)" }}
                >
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: "10px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontSize: "9px",
              color: "rgba(255,255,255,0.22)",
              lineHeight: 1.6,
            }}
          >
            Bobot: CHL 40% · SST 30% · Gelombang 20% · Angin 10%
          </div>
        </div>
      </div>

      {status === "done" && spots.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 16,
            zIndex: 1000,
            width: "208px",
          }}
        >
          <div className="gp" style={{ padding: "12px 14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.28)",
                  textTransform: "uppercase",
                }}
              >
                Top Spots
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.18)",
                  fontFamily: "monospace",
                }}
              >
                {spots.length} titik
              </span>
            </div>
            {spots.slice(0, 6).map((spot, idx) => {
              const c = scoreColor(spot.score);
              return (
                <div
                  key={spot.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 0",
                    borderBottom:
                      idx < Math.min(spots.length, 6) - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "7px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.2)",
                        fontFamily: "monospace",
                        width: "14px",
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: "monospace",
                      }}
                    >
                      {Math.abs(spot.lat).toFixed(2)}°S {spot.lng.toFixed(2)}°E
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: c.text,
                      fontFamily: "monospace",
                    }}
                  >
                    {spot.score}
                  </span>
                </div>
              );
            })}
            {generatedAt && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.18)",
                  textAlign: "right",
                }}
              >
                {new Date(generatedAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </div>
            )}
          </div>
        </div>
      )}

      {status === "done" && (
        <div style={{ position: "absolute", top: 80, left: 16, zIndex: 1000 }}>
          <button
            onClick={() => void loadSpots()}
            className="gp"
            style={{
              padding: "9px 14px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            🔄 Perbarui Data
          </button>
        </div>
      )}
    </div>
  );
}
