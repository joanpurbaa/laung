import { NextResponse } from "next/server";
import { db } from "~/lib/prisma";
import { sendPushNotification } from "~/lib/push";

export async function GET() {
  const subs = await db.pushSubscription.findMany();

  if (subs.length === 0) {
    return NextResponse.json({
      error: "Tidak ada subscriber",
      hint: "Buka /profile dulu dan klik Aktifkan Notifikasi",
    });
  }

  const results = await Promise.all(
    subs.map((sub) =>
      sendPushNotification(sub, {
        title: "🎣 Test Notifikasi Laung",
        body: "Kalau ini muncul, push notification berhasil!",
        tag: "test",
        url: "/dashboard",
      }),
    ),
  );

  return NextResponse.json({ success: true, results, count: subs.length });
}
