import { NextResponse } from "next/server";
import { db } from "~/lib/prisma";
import { laporHilangSchema } from "~/lib/validators/familyView";
import {
  normalizeReportCode,
  codesMatch,
  REPORT_CODE_CHARS,
} from "~/lib/report-code";
import { normalizeUsername } from "~/lib/username";
import { formatWaktuId } from "~/lib/family-message";
import { generateLaporanHilangPdf } from "~/lib/pdf/laporan-hilang";
import {
  consumeRateLimit,
  getClientIp,
  hashIp,
} from "~/lib/rate-limit";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_FAILS_PER_USERNAME_PER_HOUR = 5;
const MAX_REQUESTS_PER_IP_PER_HOUR = 20;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const GENERIC_ERROR = "Username atau kode laporan tidak cocok.";

function json(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Terlalu banyak percobaan. Coba lagi nanti." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

function validCode(value: string): boolean {
  for (const ch of value) {
    if (!REPORT_CODE_CHARS.includes(ch)) return false;
  }
  return true;
}

function formatDateFile(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function handleFailure(usernameKey: string) {
  const failCheck = await consumeRateLimit(
    `fail:${usernameKey}`,
    MAX_FAILS_PER_USERNAME_PER_HOUR,
  );
  if (!failCheck.ok) return rateLimitResponse(failCheck.retryAfterSeconds);
  return json(404, GENERIC_ERROR);
}

export async function POST(req: Request) {
  const ip = hashIp(getClientIp(req));
  const ipCheck = await consumeRateLimit(
    `ip:${ip}`,
    MAX_REQUESTS_PER_IP_PER_HOUR,
  );
  if (!ipCheck.ok) return rateLimitResponse(ipCheck.retryAfterSeconds);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json(400, "Data form tidak valid.");
  }

  const parsed = laporHilangSchema.safeParse({
    username: form.get("username") ?? "",
    code: form.get("code") ?? "",
    reporterName: form.get("reporterName") ?? "",
    reporterPhone: form.get("reporterPhone") ?? "",
    keterangan: form.get("keterangan") ?? "",
  });
  if (!parsed.success) {
    return json(
      400,
      parsed.error.errors[0]?.message ?? "Input tidak valid.",
    );
  }

  const file = form.get("foto");
  let fotoBuffer: Buffer | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PHOTO_BYTES) {
      return json(400, "Ukuran foto maksimal 5MB.");
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return json(400, "Format foto harus JPG, PNG, atau WEBP.");
    }
    fotoBuffer = Buffer.from(await file.arrayBuffer());
  }

  const usernameKey = normalizeUsername(parsed.data.username);
  if (!usernameKey) {
    return json(400, "Username tidak valid.");
  }

  const codeInput = normalizeReportCode(parsed.data.code);
  if (!codeInput || !validCode(codeInput)) {
    return json(400, "Kode laporan tidak valid.");
  }

  const user = await db.user.findFirst({
    where: { username: { equals: usernameKey, mode: "insensitive" } },
  });

  if (!user) {
    return handleFailure(usernameKey);
  }

  const session = await db.familyViewSession.findFirst({
    where: {
      userId: user.id,
      code: { equals: codeInput },
      OR: [{ isActive: true }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { startedAt: "desc" },
    include: {
      locationLogs: { orderBy: { sentAt: "desc" } },
    },
  });

  if (!session || !codesMatch(session.code, codeInput)) {
    return handleFailure(usernameKey);
  }

  const latestLocation = session.locationLogs.find((log) => log.sendSuccess);
  const lokasi = latestLocation
    ? {
        area: latestLocation.areaName ?? undefined,
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        waktuKirim: formatWaktuId(latestLocation.sentAt),
      }
    : null;

  const buffer = await generateLaporanHilangPdf({
    nama: user.name ?? "Tanpa nama",
    username: user.username ?? usernameKey,
    kode: codeInput,
    waktuLapor: formatWaktuId(new Date()),
    mulaiSesi: formatWaktuId(session.startedAt),
    lokasi,
    keterangan: parsed.data.keterangan,
    pelapor: {
      nama: parsed.data.reporterName,
      telepon: parsed.data.reporterPhone,
    },
    foto: fotoBuffer,
  });

  await db.missingReportAudit.create({
    data: {
      reportedUserId: user.id,
      reporterName: parsed.data.reporterName,
      reporterPhone: parsed.data.reporterPhone,
    },
  });

  const filename = `laporan-hilang-${(user.username ?? usernameKey).toLowerCase()}-${formatDateFile(new Date())}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "Content-Length": String(buffer.length),
    },
  });
}