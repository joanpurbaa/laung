import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/prisma";
import { sendPushNotification } from "~/lib/push";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const hour = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  ).getHours();

  const notifications: {
    title: string;
    body: string;
    tag: string;
    url: string;
  }[] = [];

  if (hour === 3) {
    notifications.push({
      title: "🎣 Persiapkan Kapalmu!",
      body: "Waktu terbaik melaut dimulai pukul 05:00 WIB. Cek kondisi cuaca dan siapkan perlengkapan.",
      tag: "sail-reminder",
      url: "/dashboard",
    });
  }

  if (hour === 6) {
    notifications.push({
      title: "🗺️ Spot Hari Ini Sudah Siap",
      body: "Buka peta ZPPI untuk lihat rekomendasi spot terbaik berdasarkan data satelit terkini.",
      tag: "zppi-update",
      url: "/map",
    });
  }

  if (hour === 5 || hour === 12) {
    try {
      const weatherRes = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-6.465&longitude=108.452&current=wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=Asia/Jakarta",
      );
      const weatherData = (await weatherRes.json()) as {
        current: { wind_speed_10m: number; weather_code: number };
      };

      const windSpeed = weatherData.current.wind_speed_10m;
      const weatherCode = weatherData.current.weather_code;

      const isBadWeather = windSpeed > 30 || weatherCode >= 60;

      if (isBadWeather) {
        notifications.push({
          title: "⛈️ Peringatan Cuaca Laut",
          body: `Angin ${Math.round(windSpeed)} km/h terdeteksi. Pertimbangkan keselamatan sebelum berlayar. Selalu cek BMKG.`,
          tag: "weather-warning",
          url: "/dashboard",
        });
      }
    } catch {}
  }

  if (notifications.length === 0) {
    return NextResponse.json({
      sent: 0,
      message: "No notifications scheduled",
    });
  }

  const allSubs = await db.pushSubscription.findMany();
  let sent = 0;

  await Promise.allSettled(
    allSubs.flatMap((sub) =>
      notifications.map(async (notif) => {
        const result = await sendPushNotification(sub, {
          ...notif,
          requireInteraction: notif.tag === "weather-warning",
        });
        if (result.success) sent++;
        if (result.expired) {
          await db.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => null);
        }
      }),
    ),
  );

  return NextResponse.json({ sent, subscribers: allSubs.length });
}
