"use server";

import { auth } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { sendWhatsAppMessage } from "~/lib/fonnte";
import { reverseGeocode } from "~/lib/geocode";
import { generateReportCode } from "~/lib/report-code";
import { startFamilyViewSchema } from "~/lib/validators/familyView";
import {
  buildFamilyViewMessage,
  formatWaktuId,
} from "~/lib/family-message";

export interface FamilyViewSessionInfo {
  code: string;
  username: string;
  name: string | null;
  frequencyPerHour: number;
  phone: string;
  message: string | null;
  startedAt: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
}

export type FamilyViewActionResult =
  | { success: true; session: FamilyViewSessionInfo }
  | { success: false; error: string };

export type FamilyViewStopResult =
  | { success: true }
  | { success: false; error: string };

export type FamilyViewActiveResult =
  | { success: true; active: true; session: FamilyViewSessionInfo }
  | { success: true; active: false }
  | { success: false; error: string };

const SESSION_TTL_HOURS = 24;

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReportCode();
    const existing = await db.familyViewSession.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Gagal membuat kode laporan, coba lagi.");
}

export async function startFamilyViewAction(
  input: unknown,
): Promise<FamilyViewActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Sesi berakhir, silakan login dulu." };
  }

  const parsed = startFamilyViewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Input tidak valid",
    };
  }

  const { phone, message, frequencyPerHour, latitude, longitude } = parsed.data;

  try {
    const now = new Date();
    await db.familyViewSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endedAt: now },
    });

    const code = await generateUniqueCode();

    const sessionRow = await db.familyViewSession.create({
      data: {
        userId,
        code,
        phone,
        message: message || null,
        frequencyPerHour,
        startedAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000),
      },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true },
    });

    const hasCoords =
      typeof latitude === "number" && typeof longitude === "number";
    const area = hasCoords ? await reverseGeocode(latitude, longitude) : null;

    const pesan = buildFamilyViewMessage({
      pesan: message?.trim() ?? "",
      userName: user?.name ?? "Nelayan",
      username: user?.username ?? "",
      code,
      lat: hasCoords ? latitude : null,
      lng: hasCoords ? longitude : null,
      area,
      waktu: formatWaktuId(now),
    });

    const fonnteRes = await sendWhatsAppMessage(phone, pesan);

    if (hasCoords) {
      await db.locationLog.create({
        data: {
          sessionId: sessionRow.id,
          userId,
          latitude: latitude,
          longitude: longitude,
          areaName: area,
          sendSuccess: fonnteRes.success,
        },
      });
    }

    return {
      success: true,
      session: {
        code,
        username: user?.username ?? "",
        name: user?.name ?? null,
        frequencyPerHour,
        phone,
        message: message || null,
        startedAt: sessionRow.startedAt.toISOString(),
        area,
        lat: hasCoords ? latitude : null,
        lng: hasCoords ? longitude : null,
      },
    };
  } catch (error) {
    console.error("startFamilyViewAction error:", error);
    return { success: false, error: "Terjadi kesalahan, coba lagi." };
  }
}

export async function stopFamilyViewAction(): Promise<FamilyViewStopResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Sesi berakhir, silakan login dulu." };

  try {
    await db.familyViewSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });
  } catch (error) {
    console.error("stopFamilyViewAction error:", error);
    return { success: false, error: "Koneksi sedang bermasalah, coba lagi." };
  }

  return { success: true };
}

export async function getFamilyViewActiveAction(): Promise<FamilyViewActiveResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Sesi berakhir, silakan login dulu." };
  }

  try {
    const active = await db.familyViewSession.findFirst({
      where: { userId, isActive: true },
      orderBy: { startedAt: "desc" },
    });

    if (!active) return { success: true, active: false };

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true },
    });

    const lastLog = await db.locationLog.findFirst({
      where: { sessionId: active.id },
      orderBy: { sentAt: "desc" },
    });

    return {
      success: true,
      active: true,
      session: {
        code: active.code,
        username: user?.username ?? "",
        name: user?.name ?? null,
        frequencyPerHour: active.frequencyPerHour,
        phone: active.phone,
        message: active.message,
        startedAt: active.startedAt.toISOString(),
        area: lastLog?.areaName ?? null,
        lat: lastLog?.latitude ?? null,
        lng: lastLog?.longitude ?? null,
      },
    };
  } catch (error) {
    console.error("getFamilyViewActiveAction error:", error);
    return { success: false, error: "Koneksi sedang bermasalah, coba lagi." };
  }
}