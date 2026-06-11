"use server";

import { sendPushNotification, type NotifPayload } from "../push";
import { auth } from "../auth";
import { db } from "../prisma";

export async function subscribePushAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return { success: true };
}

export async function unsubscribePushAction(
  endpoint: string,
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await db.pushSubscription.delete({ where: { endpoint } }).catch(() => null);

  return { success: true };
}

export async function sendNotifToUserAction(
  userId: string,
  payload: NotifPayload,
) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);
      if (result.expired) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
      return result;
    }),
  );

  return results;
}

export async function broadcastWeatherAlertAction(payload: NotifPayload) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const allSubs = await db.pushSubscription.findMany();

  await Promise.allSettled(
    allSubs.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);
      if (result.expired) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
    }),
  );

  return { success: true };
}
