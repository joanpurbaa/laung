"use server";

import { auth } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { Redis } from "@upstash/redis";
import { sendNotifToUserAction } from "~/lib/actions/push";
import type { EmergencyCategory, DetailedEmergencyReport, MaritimePosko } from "~/types/sos";
import {
  calculateDistanceKm,
  kmToNauticalMiles,
  getSortedMaritimePosko,
  buildEmergencyDispatchMessage,
  buildVhfRadioScript,
} from "~/lib/maritime-safety";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const HAVERSINE_RADIUS_KM = 50;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SHARELOCK_ACTIVE_USERS_KEY = "sharelock:active_users";
const SHARELOCK_HEARTBEAT_PREFIX = "sharelock:heartbeat:";
const EMERGENCY_ACTIVE_ALERTS_KEY = "emergency:active_alerts";
const EMERGENCY_RESPONDERS_PREFIX = "emergency:responders:";

export interface SendEmergencyInput {
  latitude: number;
  longitude: number;
  accuracy?: number;
  category: EmergencyCategory;
  categoryLabel: string;
  crewCount: number;
  message?: string;
  contactPhone?: string;
  targetPoskoId?: string;
}

export async function sendDetailedEmergencyAction(
  input: SendEmergencyInput,
): Promise<
  ActionResult<{
    alertId: string;
    dispatchMessage: string;
    vhfScript: string;
    nearestPosko: MaritimePosko & { distanceKm: number; distanceNm: number };
  }>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  const userName = session.user.name ?? "Nelayan Pantura";
  const sortedPosko = getSortedMaritimePosko(input.latitude, input.longitude);
  const nearestPosko = sortedPosko[0]!;

  const selectedPosko = input.targetPoskoId
    ? sortedPosko.find((p) => p.id === input.targetPoskoId) ?? nearestPosko
    : nearestPosko;

  // Format payload untuk message Prisma
  const structuredData = {
    category: input.category,
    categoryLabel: input.categoryLabel,
    crewCount: input.crewCount,
    description: input.message ?? "",
    contactPhone: input.contactPhone ?? "",
    targetPoskoId: selectedPosko.id,
    targetPoskoName: selectedPosko.name,
    accuracy: input.accuracy,
    sentAt: new Date().toISOString(),
  };

  // 1. Simpan ke Database Prisma
  const alert = await db.sOSAlert.create({
    data: {
      userId: session.user.id,
      latitude: input.latitude,
      longitude: input.longitude,
      message: JSON.stringify(structuredData),
    },
  });

  // 2. Update LiveLocation agar muncul di radar seluruh armada
  await db.liveLocation.upsert({
    where: { userId: session.user.id },
    update: {
      isSOS: true,
      isSharing: true,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      lastSeen: new Date(),
    },
    create: {
      userId: session.user.id,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      isSharing: true,
      isSOS: true,
    },
  });

  // 3. Masukkan ke Redis agar langsung sinkron tanpa delay
  try {
    await redis.sadd(SHARELOCK_ACTIVE_USERS_KEY, session.user.id);
    await redis.set(`${SHARELOCK_HEARTBEAT_PREFIX}${session.user.id}`, "1", {
      ex: 3600,
    });

    const redisAlertItem: DetailedEmergencyReport = {
      id: alert.id,
      userId: session.user.id,
      userName,
      category: input.category,
      categoryLabel: input.categoryLabel,
      message: input.message,
      crewCount: input.crewCount,
      contactPhone: input.contactPhone,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      createdAt: new Date().toISOString(),
      isResolved: false,
      targetPoskoName: selectedPosko.name,
    };

    await redis.hset(EMERGENCY_ACTIVE_ALERTS_KEY, {
      [alert.id]: JSON.stringify(redisAlertItem),
    });
  } catch (err) {
    console.warn("Peringatan Redis emergency sync:", err);
  }

  // 4. Kirim Push Notification ke seluruh nelayan dalam radius 50km
  try {
    const nearbyLocations = await db.liveLocation.findMany({
      where: {
        isSharing: true,
        userId: { not: session.user.id },
      },
      include: { user: { include: { pushSubscriptions: true } } },
    });

    const notifPromises = nearbyLocations
      .filter((loc) => {
        const dist = calculateDistanceKm(
          input.latitude,
          input.longitude,
          loc.latitude,
          loc.longitude,
        );
        return dist <= HAVERSINE_RADIUS_KM;
      })
      .flatMap((loc) => {
        const dist = Math.round(
          calculateDistanceKm(
            input.latitude,
            input.longitude,
            loc.latitude,
            loc.longitude,
          ),
        );
        return loc.user.pushSubscriptions.map(() =>
          sendNotifToUserAction(loc.userId, {
            title: `🆘 SOS: ${input.categoryLabel}!`,
            body: `Nelayan ${userName} butuh pertolongan darurat. Jarak: ~${dist} km dari posisimu (${input.crewCount} awak di kapal).`,
            tag: `sos-${alert.id}`,
            url: "/map?sos=true",
            requireInteraction: true,
          }),
        );
      });

    await Promise.allSettled(notifPromises);
  } catch (err) {
    console.warn("Gagal mengirim push notifikasi darurat:", err);
  }

  // 5. Siapkan Pesan WhatsApp & VHF Radio Script
  const dispatchMessage = buildEmergencyDispatchMessage({
    userName,
    categoryLabel: input.categoryLabel,
    latitude: input.latitude,
    longitude: input.longitude,
    crewCount: input.crewCount,
    message: input.message,
    nearestPoskoName: selectedPosko.name,
    distanceKm: selectedPosko.distanceKm,
  });

  const vhfScript = buildVhfRadioScript({
    userName,
    categoryLabel: input.categoryLabel,
    latitude: input.latitude,
    longitude: input.longitude,
    crewCount: input.crewCount,
  });

  return {
    success: true,
    data: {
      alertId: alert.id,
      dispatchMessage,
      vhfScript,
      nearestPosko: selectedPosko,
    },
  };
}

export async function getActiveEmergenciesAction(): Promise<
  ActionResult<DetailedEmergencyReport[]>
> {
  try {
    const alerts = await db.sOSAlert.findMany({
      where: { isResolved: false },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const reports: DetailedEmergencyReport[] = alerts.map((a) => {
      let parsedMeta: any = {};
      try {
        if (a.message && a.message.startsWith("{")) {
          parsedMeta = JSON.parse(a.message);
        }
      } catch {
        parsedMeta = {};
      }

      const category: EmergencyCategory =
        parsedMeta.category ?? "GENERAL_SOS";
      const categoryLabel: string =
        parsedMeta.categoryLabel ?? a.message ?? "Darurat SOS";
      const crewCount: number = parsedMeta.crewCount ?? 1;

      return {
        id: a.id,
        userId: a.userId,
        userName: a.user.name ?? "Nelayan",
        category,
        categoryLabel,
        message: parsedMeta.description ?? (a.message?.startsWith("{") ? "" : a.message),
        crewCount,
        contactPhone: parsedMeta.contactPhone,
        latitude: a.latitude,
        longitude: a.longitude,
        accuracy: parsedMeta.accuracy,
        createdAt: a.createdAt.toISOString(),
        isResolved: a.isResolved,
        resolvedAt: a.resolvedAt?.toISOString() ?? null,
        targetPoskoName: parsedMeta.targetPoskoName,
      };
    });

    return { success: true, data: reports };
  } catch (error: any) {
    console.error("Gagal mengambil laporan darurat aktif:", error);
    return { success: false, error: "Gagal memuat data darurat" };
  }
}

export async function respondToEmergencyAction(
  alertId: string,
): Promise<ActionResult<{ helperName: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  const helperName = session.user.name ?? "Rekan Nelayan";

  try {
    const alert = await db.sOSAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) return { success: false, error: "Laporan darurat tidak ditemukan" };

    // Catat responder di Redis
    await redis.sadd(`${EMERGENCY_RESPONDERS_PREFIX}${alertId}`, helperName);

    // Kirim notifikasi dorongan moral ke korban
    await sendNotifToUserAction(alert.userId, {
      title: "🚀 Bantuan Sedang Menuju Lokasimu!",
      body: `Nelayan ${helperName} merespons sinyal daruratmu dan sedang bergerak ke koordinatmu. Bertahanlah!`,
      tag: `sos-response-${alertId}`,
      url: "/map",
      requireInteraction: true,
    });

    return { success: true, data: { helperName } };
  } catch (error: any) {
    console.error("Gagal merespons darurat:", error);
    return { success: false, error: "Gagal mengirim status pertolongan" };
  }
}

export async function resolveEmergencyAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  try {
    const activeAlerts = await db.sOSAlert.findMany({
      where: { userId: session.user.id, isResolved: false },
      select: { id: true },
    });

    await db.sOSAlert.updateMany({
      where: { userId: session.user.id, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    await db.liveLocation.updateMany({
      where: { userId: session.user.id },
      data: { isSOS: false },
    });

    // Bersihkan dari Redis
    if (activeAlerts.length > 0) {
      await Promise.allSettled(
        activeAlerts.map(async (a) => {
          await redis.hdel(EMERGENCY_ACTIVE_ALERTS_KEY, a.id);
          await redis.del(`${EMERGENCY_RESPONDERS_PREFIX}${a.id}`);
        }),
      );
    }

    return { success: true, data: undefined };
  } catch (error: any) {
    console.error("Gagal menyelesaikan status darurat:", error);
    return { success: false, error: "Gagal menyelesaikan status darurat" };
  }
}
