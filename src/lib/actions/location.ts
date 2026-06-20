"use server";

import { auth } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { sendNotifToUserAction } from "~/lib/actions/push";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Radius untuk mengirim SOS alert ke nearby users (km)
const HAVERSINE_RADIUS_KM = 50;

export async function updateLocationAction(coords: {
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  await db.liveLocation.upsert({
    where: { userId: session.user.id },
    update: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      lastSeen: new Date(),
    },
    create: {
      userId: session.user.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      isSharing: false,
      isSOS: false,
    },
  });

  return { success: true, data: undefined };
}

export async function toggleShareLocationAction(
  isSharing: boolean,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  await db.liveLocation.upsert({
    where: { userId: session.user.id },
    update: {
      isSharing,
      lastSeen: new Date(),
    },
    create: {
      userId: session.user.id,
      latitude: 0,
      longitude: 0,
      isSharing,
      isSOS: false,
      lastSeen: new Date(),
    },
  });

  return { success: true, data: undefined };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function sendSOSAction(coords: {
  latitude: number;
  longitude: number;
  message?: string;
}): Promise<ActionResult<{ alertId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  const alert = await db.sOSAlert.create({
    data: {
      userId: session.user.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      message: coords.message ?? "Butuh bantuan!",
    },
  });

  await db.liveLocation.upsert({
    where: { userId: session.user.id },
    update: {
      isSOS: true,
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    create: {
      userId: session.user.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
      isSharing: true,
      isSOS: true,
    },
  });

  const nearbyUsers = await db.liveLocation.findMany({
    where: {
      isSharing: true,
      isSOS: false,
      userId: { not: session.user.id },
    },
    include: {
      user: {
        include: { pushSubscriptions: true },
      },
    },
  });

  const userName = session.user.name ?? "Nelayan";

  const notifPromises = nearbyUsers
    .filter((loc) => {
      const dist = haversineDistance(
        coords.latitude,
        coords.longitude,
        loc.latitude,
        loc.longitude,
      );
      return dist <= HAVERSINE_RADIUS_KM;
    })
    .flatMap((loc) =>
      loc.user.pushSubscriptions.map((sub) =>
        sendNotifToUserAction(loc.userId, {
          title: "🆘 SOS — Nelayan Butuh Bantuan!",
          body: `${userName} membutuhkan pertolongan. Jarak: ~${Math.round(
            haversineDistance(
              coords.latitude,
              coords.longitude,
              loc.latitude,
              loc.longitude,
            ),
          )} km dari posisimu.`,
          tag: "sos-alert",
          url: "/map?sos=true",
          requireInteraction: true,
        }),
      ),
    );

  await Promise.allSettled(notifPromises);

  return { success: true, data: { alertId: alert.id } };
}

export async function resolveSOSAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  await db.sOSAlert.updateMany({
    where: { userId: session.user.id, isResolved: false },
    data: { isResolved: true, resolvedAt: new Date() },
  });

  await db.liveLocation.update({
    where: { userId: session.user.id },
    data: { isSOS: false },
  });

  return { success: true, data: undefined };
}
// ini ak buat fungsi sharespotaction
export async function shareSpotAction(coords: {
  recipientId: string;
  latitude: number;
  longitude: number;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  try {
    await db.sharedSpot.create({
      data: {
        senderId: session.user.id,
        recipientId: coords.recipientId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Gagal share spot via Prisma:", error);
    return { success: false, error: "Gagal membagikan lokasi" };
  }
}