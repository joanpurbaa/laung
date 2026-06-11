import "server-only";
import webpush from "web-push";
import { env } from "~/env";

webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

export type NotifPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
};

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: NotifPayload,
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    );
    return { success: true };
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      return { success: false, expired: true };
    }
    return { success: false, expired: false };
  }
}
