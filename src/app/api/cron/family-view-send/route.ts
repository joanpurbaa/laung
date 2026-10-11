import { NextResponse, type NextRequest } from "next/server";
import { db } from "~/lib/prisma";
import { sendWhatsAppMessage } from "~/lib/fonnte";
import { reverseGeocode } from "~/lib/geocode";
import { buildFamilyViewMessage, formatWaktuId } from "~/lib/family-message";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeSessions = await db.familyViewSession.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, username: true, liveLocation: true } },
      },
    });

    const now = new Date();
    const results: string[] = [];

    for (const session of activeSessions) {
      const location = session.user.liveLocation;
      if (!location) continue;

      const intervalMinutes = Math.max(
        15,
        Math.round(60 / session.frequencyPerHour),
      );

      const latestLog = await db.locationLog.findFirst({
        where: { sessionId: session.id },
        orderBy: { sentAt: "desc" },
        select: { sentAt: true },
      });

      if (
        latestLog &&
        now.getTime() - new Date(latestLog.sentAt).getTime() <
          intervalMinutes * 60 * 1000
      ) {
        continue;
      }

      const area = await reverseGeocode(location.latitude, location.longitude);

      const pesan = buildFamilyViewMessage({
        pesan: session.message?.trim() ?? "",
        userName: session.user.name ?? "Nelayan",
        username: session.user.username ?? "",
        code: session.code,
        lat: location.latitude,
        lng: location.longitude,
        area,
        waktu: formatWaktuId(now),
      });

      const fonnteRes = await sendWhatsAppMessage(session.phone, pesan);

      await db.locationLog.create({
        data: {
          sessionId: session.id,
          userId: session.userId,
          latitude: location.latitude,
          longitude: location.longitude,
          areaName: area,
          sendSuccess: fonnteRes.success,
        },
      });

      results.push(`${session.code}:${fonnteRes.success ? "OK" : "FAIL"}`);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}