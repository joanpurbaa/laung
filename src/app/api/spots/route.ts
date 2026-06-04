// src/app/api/spots/route.ts
import { NextResponse } from "next/server";
import { getSpotsWithCache } from "~/lib/spotsCache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🔵 GET /api/spots");
    const data = await getSpotsWithCache();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        "X-Cache": data.fromCache ? "HIT" : "MISS",
        "X-TTL-Remaining": String(data.ttlRemaining ?? 0),
      },
    });
  } catch (err) {
    console.error("🔴 /api/spots error:", err);
    return NextResponse.json(
      { error: "Failed to compute spots", detail: String(err) },
      { status: 500 },
    );
  }
}
