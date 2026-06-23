import { NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { redis } from "~/lib/redis";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const CACHE_KEY = `cache:fleet:${session.user.id}`;

    const cachedFleet = await redis.get(CACHE_KEY);
    if (cachedFleet) {
      return NextResponse.json(cachedFleet);
    }

    const fleetMembers = await db.liveLocation.findMany({
      where: {
        isSharing: true,
        userId: { not: session.user.id },
        lastSeen: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastSeen: "desc",
      },
    });

    const formatted = fleetMembers.map((loc) => ({
      userId: loc.userId,
      userName: loc.user.name ?? loc.user.email.split("@")[0] ?? "Nelayan",
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      isSOS: loc.isSOS,
      lastSeen: loc.lastSeen.toISOString(),
    }));

    await redis.set(CACHE_KEY, formatted, { ex: 15 });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching fleet members:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
