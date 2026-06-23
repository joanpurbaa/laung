import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { redis } from "~/lib/redis";

const CACHE_KEY = "cache:chlorophyll";
const CACHE_TTL = 3600;

export async function GET() {
  try {
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const filePath = path.join(process.cwd(), "src/data/chlorophyll.json");
    const fileData = fs.readFileSync(filePath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const spots = JSON.parse(fileData);

    await redis.set(CACHE_KEY, spots, { ex: CACHE_TTL });

    return NextResponse.json(spots);
  } catch (error) {
    console.error("Gagal membaca file JSON di server:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
