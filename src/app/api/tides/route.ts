import { NextResponse } from "next/server";
import { redis } from "~/lib/redis";

const CACHE_KEY = "cache:tides";
const CACHE_TTL = 3600;

export async function GET() {
  const cachedData = await redis.get(CACHE_KEY);
  if (cachedData) {
    return NextResponse.json(cachedData);
  }

  const mockTides = [
    { time: "00:00", height: 0.4, status: "Surut" },
    { time: "03:00", height: 0.2, status: "Surut Terendah" },
    { time: "06:00", height: 0.6, status: "Menuju Pasang" },
    { time: "09:00", height: 1.1, status: "Pasang" },
    { time: "12:00", height: 1.5, status: "Pasang Tertinggi" },
    { time: "15:00", height: 1.2, status: "Menuju Surut" },
    { time: "18:00", height: 0.7, status: "Surut" },
    { time: "21:00", height: 0.5, status: "Surut" },
  ];

  await redis.set(CACHE_KEY, mockTides, { ex: CACHE_TTL });

  return NextResponse.json(mockTides);
}
