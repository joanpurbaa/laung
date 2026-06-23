"use server";

import { auth } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { Redis } from "@upstash/redis";
import { sendNotifToUserAction } from "~/lib/actions/push";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Radius untuk mengirim SOS alert ke nearby users (km)
const HAVERSINE_RADIUS_KM = 50;

// ── Redis Keys ──────────────────────────────────────────────
const SHARELOCK_ACTIVE_USERS_KEY = "sharelock:active_users";
const SHARELOCK_RELATIONS_PREFIX = "sharelock:relations:"; // + recipientId
const SHARELOCK_USER_TARGETS_PREFIX = "sharelock:user_targets:"; // + senderId
const SHARELOCK_HEARTBEAT_PREFIX = "sharelock:heartbeat:"; // + userId
const SHARELOCK_HEARTBEAT_TTL_SECONDS = 10 * 60;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Redis Helpers ────────────────────────────────────────────
async function activateSharelockRedis(userId: string) {
  await redis.sadd(SHARELOCK_ACTIVE_USERS_KEY, userId);
}

async function deactivateSharelockRedis(userId: string) {
  // Ambil semua data relasi sebelum dihapus
  const targetKey = `${SHARELOCK_USER_TARGETS_PREFIX}${userId}`;
  const targets = await redis.smembers(targetKey);

  const relationKey = `${SHARELOCK_RELATIONS_PREFIX}${userId}`;
  const senders = await redis.smembers(relationKey);

  const pipeline = redis.pipeline();

  // 1. Hapus dari daftar aktif (Keluar dari Lobi)
  pipeline.srem(SHARELOCK_ACTIVE_USERS_KEY, userId);

  // 2. Tarik kembali kunci yang pernah dikirim User ini ke orang lain
  if (targets.length > 0) {
    for (const recipientId of targets) {
      pipeline.srem(`${SHARELOCK_RELATIONS_PREFIX}${recipientId}`, userId);
    }
  }
  pipeline.del(targetKey);

  // 3. Buang juga kunci yang orang lain berikan ke User ini (Sama-sama buta)
  if (senders.length > 0) {
    for (const senderId of senders) {
      pipeline.srem(`${SHARELOCK_USER_TARGETS_PREFIX}${senderId}`, userId);
    }
  }
  pipeline.del(relationKey);

  // Eksekusi semua perintah sapu bersih dalam satu tembakan (atomic)
  await pipeline.exec();
}

export async function pruneStaleSharelock(): Promise<void> {
  const activeIds = await redis.smembers(SHARELOCK_ACTIVE_USERS_KEY);
  if (activeIds.length === 0) return;

  const heartbeats = await Promise.all(
    activeIds.map((id) => redis.exists(`${SHARELOCK_HEARTBEAT_PREFIX}${id}`)),
  );

  const staleIds = activeIds.filter((_, idx) => heartbeats[idx] === 0);
  if (staleIds.length === 0) return;

  await Promise.all(staleIds.map((id) => deactivateSharelockRedis(id)));
}

// ── Actions ──────────────────────────────────────────────────
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

  await redis.set(`${SHARELOCK_HEARTBEAT_PREFIX}${session.user.id}`, "1", {
    ex: SHARELOCK_HEARTBEAT_TTL_SECONDS,
  });

  return { success: true, data: undefined };
}

export async function toggleShareLocationAction(
  isSharing: boolean,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  try {
    await db.liveLocation.upsert({
      where: { userId: session.user.id },
      update: {
        isSharing,
        isSOS: isSharing ? undefined : false,
        lastSeen: new Date(),
      },
      create: {
        userId: session.user.id,
        latitude: 0,
        longitude: 0,
        isSharing,
        isSOS: false,
      },
    });

    if (isSharing) {
      await activateSharelockRedis(session.user.id);
      await redis.set(`${SHARELOCK_HEARTBEAT_PREFIX}${session.user.id}`, "1", {
        ex: SHARELOCK_HEARTBEAT_TTL_SECONDS,
      });
    } else {
      await deactivateSharelockRedis(session.user.id);
      await redis.del(`${SHARELOCK_HEARTBEAT_PREFIX}${session.user.id}`);
    }

    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error("Error toggling share location:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan sistem";
    return {
      success: false,
      error: `Gagal memperbarui status: ${errorMessage}`,
    };
  }
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

  // PAKSA isSharing jadi true agar menembus filter broadcast Supabase
  await db.liveLocation.upsert({
    where: { userId: session.user.id },
    update: {
      isSOS: true,
      isSharing: true,
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

  await activateSharelockRedis(session.user.id);
  await redis.set(`${SHARELOCK_HEARTBEAT_PREFIX}${session.user.id}`, "1", {
    ex: SHARELOCK_HEARTBEAT_TTL_SECONDS,
  });

  const nearbyUsers = await db.liveLocation.findMany({
    where: { isSharing: true, isSOS: false, userId: { not: session.user.id } },
    include: { user: { include: { pushSubscriptions: true } } },
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
  } catch (error: unknown) {
    console.error("Gagal share spot via Prisma:", error);
    return { success: false, error: "Gagal membagikan lokasi" };
  }
}

// ── P2P Sharelock Actions ──────────────────────────────
export async function addSharelockRelationAction(
  recipientId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };
  const senderId = session.user.id;
  const senderName = session.user.name ?? "Nelayan";

  const isActive = await redis.sismember(
    SHARELOCK_ACTIVE_USERS_KEY,
    recipientId,
  );
  if (!isActive) {
    return {
      success: false,
      error: "Pengguna tujuan tidak sedang aktif berbagi lokasi.",
    };
  }

  // 1. Catat ke Redis
  await redis.sadd(`${SHARELOCK_RELATIONS_PREFIX}${recipientId}`, senderId);
  await redis.sadd(`${SHARELOCK_USER_TARGETS_PREFIX}${senderId}`, recipientId);

  // 2. Tembakkan Push Notification ke Penerima Akses
  try {
    await sendNotifToUserAction(recipientId, {
      title: "📡 Radar Terhubung!",
      body: `${senderName} baru saja membagikan posisi kapalnya dengan Anda. Cek peta sekarang.`,
      tag: "sharelock-alert",
      url: "/map",
    });
  } catch (err: unknown) {
    // Kalau push notif gagal, proses tetep jalan biar fungsionalitas utama gak terganggu
    console.error("Gagal mengirim push notifikasi Sharelock:", err);
  }

  return { success: true, data: undefined };
}

export async function removeSharelockRelationAction(
  recipientId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };
  const senderId = session.user.id;

  await redis.srem(`${SHARELOCK_RELATIONS_PREFIX}${recipientId}`, senderId);
  await redis.srem(`${SHARELOCK_USER_TARGETS_PREFIX}${senderId}`, recipientId);

  return { success: true, data: undefined };
}

export async function getActiveSharelockUsersAction(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  await pruneStaleSharelock();

  const activeIds = await redis.smembers(SHARELOCK_ACTIVE_USERS_KEY);
  if (activeIds.length === 0) return { success: true, data: [] };

  const otherIds = activeIds.filter((id) => id !== session.user.id);
  if (otherIds.length === 0) return { success: true, data: [] };

  const users = await db.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true },
  });

  const result = users.map((u) => ({ id: u.id, name: u.name ?? "Nelayan" }));
  return { success: true, data: result };
}

export async function getIncomingSharelockSendersAction(): Promise<
  ActionResult<string[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };
  const senders = await redis.smembers(
    `${SHARELOCK_RELATIONS_PREFIX}${session.user.id}`,
  );
  return { success: true, data: senders };
}

export async function getOutgoingSharelockTargetsAction(): Promise<
  ActionResult<string[]>
> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };
  const targets = await redis.smembers(
    `${SHARELOCK_USER_TARGETS_PREFIX}${session.user.id}`,
  );
  return { success: true, data: targets };
}
