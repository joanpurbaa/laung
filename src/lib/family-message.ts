import "server-only";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://laung.vercel.app";

export interface FamilyViewMessageInput {
  pesan: string;
  userName: string;
  username: string;
  code: string;
  lat?: number | null;
  lng?: number | null;
  area?: string | null;
  waktu: string;
}

export function formatWaktuId(date: Date): string {
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function mapsUrl(lat?: number | null, lng?: number | null): string | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export function buildFamilyViewMessage(input: FamilyViewMessageInput): string {
  const lines: string[] = [];
  lines.push(`\uD83D\uDCCC Kode Laporan Hilang: ${input.code}`);
  lines.push(`\uD83D\uDC64 Username: ${input.username}`);
  lines.push("");
  if (input.pesan) lines.push(input.pesan);
  lines.push(`~${input.userName}`);
  lines.push("");
  const waktu = `${input.waktu} WIB`;
  const link = mapsUrl(input.lat, input.lng);
  if (link) {
    lines.push(`\u23F0 Waktu: ${waktu}`);
    lines.push(
      input.area
        ? `\uD83D\uDCCD Area perkiraan: ${input.area}`
        : "\uD83D\uDCCD Area: Lokasi GPS",
    );
    lines.push(`\uD83D\uDDFA Lokasi terakhir: ${link}`);
  } else {
    lines.push(`\u23F0 Waktu: ${waktu}`);
    lines.push("\uD83D\uDCCD Lokasi terakhir: Lokasi tidak tersedia");
  }
  lines.push("");
  lines.push(
    `Jika tidak ada kabar, laporkan saya hilang di ${APP_URL}/lapor-hilang menggunakan username & kode di atas.`,
  );
  lines.push("Pesan dikirim otomatis oleh Family View Laung.");
  return lines.join("\n");
}