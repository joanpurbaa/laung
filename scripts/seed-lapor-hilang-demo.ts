import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const DEMO = {
  email: "demo.kejawanan.cirebon@laung.app",
  name: "Haris Nelayan Demo",
  username: "HARISKEJAWANAN",
  code: "J3K7WN",
  phone: "085123456789",
  message: "Pancing nggalang di perairan Kejawanan, aman bang.",
};

const KEJAWANAN_TRACK = [
  { lat: -6.7094, lng: 108.562, name: "Perairan Kejawanan Cirebon" },
  { lat: -6.7128, lng: 108.5707, name: "PPN Kejawanan Cirebon" },
  { lat: -6.705, lng: 108.5522, name: "Perairan Kejawanan Cirebon" },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL belum diset. Jalankan dengan: node --env-file=.env scripts/seed-lapor-hilang-demo.ts");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    let user = await db.user.findUnique({ where: { email: DEMO.email } });
    if (!user) {
      try {
        user = await db.user.create({
          data: {
            name: DEMO.name,
            username: DEMO.username,
            email: DEMO.email,
            isVerified: true,
          },
        });
      } catch {
        user = await db.user.create({
          data: {
            name: `${DEMO.name} 2`,
            username: `DEMO_${Date.now().toString(36).toUpperCase()}`,
            email: DEMO.email,
            isVerified: true,
          },
        });
      }
      console.log("User demo dibuat:", user.id, user.username);
    } else {
      if (!user.username) {
        user = await db.user.update({
          where: { id: user.id },
          data: { username: DEMO.username },
        });
      }
      console.log("User demo sudah ada:", user.id, user.username);
    }

    await db.familyViewSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    await db.familyViewSession.deleteMany({ where: { code: DEMO.code } });

    const startedAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const session = await db.familyViewSession.create({
      data: {
        userId: user.id,
        code: DEMO.code,
        phone: DEMO.phone,
        message: DEMO.message,
        frequencyPerHour: 2,
        startedAt,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    console.log("Sesi Family View dibuat:", session.id, "kode", session.code);

    for (let i = 0; i < KEJAWANAN_TRACK.length; i++) {
      const loc = KEJAWANAN_TRACK[i]!;
      const log = await db.locationLog.create({
        data: {
          sessionId: session.id,
          userId: user.id,
          latitude: loc.lat,
          longitude: loc.lng,
          areaName: loc.name,
          sendSuccess: i < 2,
          sentAt: new Date(startedAt.getTime() + (i + 1) * 60 * 60 * 1000),
        },
      });
      console.log(
        "Log lokasi:",
        log.sendSuccess ? "TERKIRIM" : "GAGAL",
        log.latitude,
        log.longitude,
      );
    }

    console.log("\nDemo siap:");
    console.log("  Username :", user.username);
    console.log("  Kode     :", DEMO.code);
    console.log("  Uji di   : /lapor-hilang");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});