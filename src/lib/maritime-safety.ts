import type { EmergencyCategoryOption, MaritimePosko, DetailedEmergencyReport } from "~/types/sos";

export const EMERGENCY_CATEGORIES: EmergencyCategoryOption[] = [
  {
    id: "ENGINE_FAILURE",
    label: "Mesin Rusak / Mati Total",
    sublabel: "Kapal terombang-ambing, butuh derek/towing",
    icon: "🚤",
    severity: "high",
    color: "#f59e0b",
  },
  {
    id: "SINKING_LEAK",
    label: "Karam / Kebocoran Lambung",
    sublabel: "Air masuk lambung atau gelombang ekstrem",
    icon: "🌊",
    severity: "critical",
    color: "#ef4444",
  },
  {
    id: "MEDICAL_MAN_OVERBOARD",
    label: "Medis / Awak Jatuh ke Laut",
    sublabel: "Kecelakaan kerja atau orang hanyut (MOB)",
    icon: "🩺",
    severity: "critical",
    color: "#dc2626",
  },
  {
    id: "FUEL_OUT",
    label: "Habis Bahan Bakar / Aki Mati",
    sublabel: "Habis solar/bensin di tengah laut",
    icon: "⛽",
    severity: "high",
    color: "#ea580c",
  },
  {
    id: "WEATHER_CRITICAL",
    label: "Cuaca Buruk / Badai Laut",
    sublabel: "Visibilitas nol, badai angin kencang",
    icon: "⛈️",
    severity: "high",
    color: "#4f46e5",
  },
  {
    id: "GENERAL_SOS",
    label: "Sinyal Bahaya Kritis (SOS)",
    sublabel: "Kondisi darurat keselamatan jiwa lainnya",
    icon: "🚨",
    severity: "critical",
    color: "#b91c1c",
  },
];

// Daftar Posko Keselamatan Maritim & SAR Resmi (Pantura Jawa Barat / Cirebon - Indramayu)
export const OFFICIAL_MARITIME_POSKO: MaritimePosko[] = [
  {
    id: "basarnas-cirebon",
    name: "BASARNAS Pos SAR Cirebon",
    fullName: "Kantor Pencarian dan Pertolongan (SAR) Pos Cirebon",
    type: "BASARNAS",
    phone: "115",
    whatsapp: "628112440115",
    radioChannel: "VHF Marine CH 16 (156.800 MHz)",
    latitude: -6.7082,
    longitude: 108.5684,
    locationName: "Kawasan Pelabuhan Cirebon",
    description: "Operasi SAR resmi 24 jam, penyelamatan kecelakaan laut & evakuasi korban.",
  },
  {
    id: "polairud-indramayu",
    name: "Satpolairud Polres Indramayu",
    fullName: "Satuan Polisi Perairan dan Udara Polres Indramayu",
    type: "POLAIRUD",
    phone: "0234-274110",
    whatsapp: "6281223456110",
    radioChannel: "VHF Marine CH 16 & CH 09",
    latitude: -6.3265,
    longitude: 108.3241,
    locationName: "Muara Karangsong, Indramayu",
    description: "Patroli kapal cepat kepolisian perairan, penanganan kriminalitas & darurat perairan.",
  },
  {
    id: "tpi-karangampel",
    name: "Posko Siaga TPI Karangampel",
    fullName: "Posko Keselamatan & Komunikasi Nelayan TPI Karangampel",
    type: "TPI_PPI",
    phone: "081394123456",
    whatsapp: "6281394123456",
    radioChannel: "VHF Marine CH 08 (Nelayan) & CH 16",
    latitude: -6.465,
    longitude: 108.452,
    locationName: "Pesisir Karangampel, Indramayu",
    description: "Pusat koordinasi armada kapal nelayan lokal Karangampel dan satwas perikanan.",
  },
  {
    id: "ksop-cirebon",
    name: "KSOP Pelabuhan Cirebon",
    fullName: "Kantor Kesyahbandaran dan Otoritas Pelabuhan Cirebon",
    type: "KSOP",
    phone: "0231-207038",
    whatsapp: "628122445588",
    radioChannel: "VHF Marine CH 16 / CH 12",
    latitude: -6.712,
    longitude: 108.565,
    locationName: "Jl. Perniagaan No. 4, Cirebon",
    description: "Otoritas lalu lintas kapal pelabuhan, stasiun radio pantai (SROP) resmi Kemenhub.",
  },
];

/**
 * Menghitung jarak Haversine dalam Kilometer
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Konversi KM ke Nautical Miles (Mil Laut)
 */
export function kmToNauticalMiles(km: number): number {
  return km / 1.852;
}

/**
 * Menghitung arah mata angin / bearing derajat (0 - 360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): { degrees: number; compassDir: string } {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;

  const compassPoints = [
    "Utara (N)",
    "Timur Laut (NE)",
    "Timur (E)",
    "Tenggara (SE)",
    "Selatan (S)",
    "Barat Daya (SW)",
    "Barat (W)",
    "Barat Laut (NW)",
  ];
  const idx = Math.round(brng / 45) % 8;
  const compassDir = compassPoints[idx] ?? "Utara (N)";

  return { degrees: Math.round(brng), compassDir };
}

/**
 * Estimasi waktu tempuh kapal dalam menit (kecepatan kapal penolong ~ 7 knot = ~13 km/jam)
 */
export function estimateRescueTimeMinutes(distanceKm: number, speedKnots = 7): number {
  const speedKmh = speedKnots * 1.852;
  const hours = distanceKm / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}

/**
 * Ambil daftar posko terurut dari yang paling dekat dengan kapal
 */
export function getSortedMaritimePosko(
  userLat: number,
  userLng: number,
): (MaritimePosko & { distanceKm: number; distanceNm: number })[] {
  return OFFICIAL_MARITIME_POSKO.map((posko) => {
    const dist = calculateDistanceKm(userLat, userLng, posko.latitude, posko.longitude);
    return {
      ...posko,
      distanceKm: parseFloat(dist.toFixed(1)),
      distanceNm: parseFloat(kmToNauticalMiles(dist).toFixed(1)),
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Buat template pesan darurat WhatsApp resmi untuk SAR / Posko
 */
export function buildEmergencyDispatchMessage(report: {
  userName: string;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  crewCount: number;
  message?: string;
  nearestPoskoName?: string;
  distanceKm?: number;
}): string {
  const gmapsUrl = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
  const now = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    `🚨 *LAPORAN DARURAT MARITIM (LAUNG SAFETY NET)* 🚨\n\n` +
    `👤 *Nama Nelayan/Kapal:* ${report.userName}\n` +
    `⚠️ *Kondisi Darurat:* ${report.categoryLabel}\n` +
    `👥 *Jumlah Awak (POB):* ${report.crewCount} Orang\n` +
    `📍 *Koordinat GPS:* ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}\n` +
    (report.nearestPoskoName
      ? `🏢 *Posko Terdekat:* ${report.nearestPoskoName} (~${report.distanceKm} km)\n`
      : "") +
    `⏰ *Waktu Kejadian:* ${now} WIB\n` +
    (report.message ? `📝 *Keterangan:* "${report.message}"\n` : "") +
    `🗺️ *Tautan Lokasi Peta:* ${gmapsUrl}\n\n` +
    `_Pesan otomatis dikirim melalui Sistem Keselamatan Maritim Laung. Mohon koordinasi dan bantuan armada terdekat segera!_`
  );
}

/**
 * Template panggilan radio maritim VHF Channel 16 (Prosedur MAYDAY)
 */
export function buildVhfRadioScript(report: {
  userName: string;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  crewCount: number;
}): string {
  return (
    `MAYDAY, MAYDAY, MAYDAY.\n` +
    `DI SINI KAPAL: "${report.userName.toUpperCase()}"\n` +
    `POSISI KAMI: Lintang ${report.latitude.toFixed(4)}, Bujur ${report.longitude.toFixed(4)}\n` +
    `KEADAAN DARURAT: ${report.categoryLabel.toUpperCase()}\n` +
    `JUMLAH AWAK DI KAPAL: ${report.crewCount} ORANG\n` +
    `KAMI MEMBUTUHKAN PERTOLONGAN SEGERA. GANTI (OVER).`
  );
}
