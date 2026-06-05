// src/app/api/chlorophyll/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 1. Baca file JSON langsung dari disk server (Sangat cepat karena menggunakan internal I/O Node.js)
    const filePath = path.join(process.cwd(), "src/data/chlorophyll.json");
    const fileData = fs.readFileSync(filePath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const spots = JSON.parse(fileData);

    // 2. Kirim data ke frontend (opsional: kamu bisa .slice(0, 5000) dulu kalau mau membatasi jumlah data di awal)
    return NextResponse.json(spots);
  } catch (error) {
    console.error("Gagal membaca file JSON di server:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
