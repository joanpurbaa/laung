import { NextResponse, type NextRequest } from "next/server";
import { sendWhatsAppMessage } from "~/lib/fonnte";
import { db } from "~/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const activeTrips = await db.trip.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          include: { familyContacts: true, liveLocation: true },
        },
      },
    });

    const now = new Date();

    for (const trip of activeTrips) {
      const contacts = trip.user.familyContacts;
      if (contacts.length === 0) continue;

      const location = trip.user.liveLocation;
      if (!location) continue;

      const timeDifferenceHours =
        (now.getTime() - new Date(location.lastSeen).getTime()) /
        (1000 * 60 * 60);
      const isLostSignal = timeDifferenceHours > 2;

      let message = "";
      if (isLostSignal) {
        message = `⚠️ *Sinyal Terputus - Laung App*\n\nSistem mendeteksi perangkat nelayan *${trip.user.name}* belum memperbarui koordinat sejak pukul ${new Date(location.lastSeen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB.\n\nKondisi ini normal terjadi saat kapal berada di zona luar jangkauan sinyal seluler. Tetap tenang, hubungi BASARNAS (115) jika tidak ada kabar lebih dari 6 jam.`;
      } else {
        message = `🎣 *Update Keselamatan Laut - Laung App*\n\nNelayan: *${trip.user.name}*\nStatus: Aman & Aktif Melaut\nPosisi terakhir diperbarui: ${new Date(location.lastSeen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB.\n\nSistem Laung otomatis mengawasi perjalanan ini.`;
      }

      for (const contact of contacts) {
        const recentLog = await db.waNotificationLog.findFirst({
          where: {
            tripId: trip.id,
            recipientPhone: contact.phone,
            sentAt: { gte: new Date(now.getTime() - 55 * 60 * 1000) },
          },
        });

        if (recentLog) continue;

        const fonnteRes = await sendWhatsAppMessage(contact.phone, message);

        if (fonnteRes.success) {
          await db.waNotificationLog.create({
            data: {
              tripId: trip.id,
              recipientPhone: contact.phone,
              messageType: isLostSignal ? "NO_SIGNAL" : "HOURLY_UPDATE",
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedTrips: activeTrips.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
