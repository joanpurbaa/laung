import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { redis } from "~/lib/redis";

const CACHE_KEY = "cache:chlorophyll";
const CACHE_TTL = 3600;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src/data/sst.json");

    const fileData = fs.readFileSync(filePath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sstData = JSON.parse(fileData);

    await redis.set(CACHE_KEY, sstData, { ex: CACHE_TTL });

    return NextResponse.json(sstData);
  } catch (error) {
    console.error("Gagal membaca file sst.json di server:", error);
    return NextResponse.json(
      { error: "Gagal memuat data suhu dari server internal" },
      { status: 500 },
    );
  }
}
