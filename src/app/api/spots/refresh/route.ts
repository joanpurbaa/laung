// src/app/api/spots/refresh/route.ts
// Endpoint untuk force refresh cache secara manual
// Dipanggil oleh tombol "Perbarui Data" di Map.tsx

import { NextResponse } from "next/server";
import { invalidateCache, getSpotsWithCache } from "~/lib/spotsCache";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("🗑️ Manual cache invalidation requested");
    await invalidateCache();

    // Langsung compute fresh data
    const data = await getSpotsWithCache();

    return NextResponse.json({ ...data, refreshed: true });
  } catch (err) {
    console.error("❌ Refresh failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
