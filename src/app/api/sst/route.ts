// src/app/api/sst/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 1. Tentukan jalur ke file sst.json yang sudah kamu ekstrak kemarin
    const filePath = path.join(process.cwd(), "src/data/sst.json");

    // 2. Baca isi file teks JSON-nya dari disk server
    const fileData = fs.readFileSync(filePath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sstData = JSON.parse(fileData);

    // 3. Kirim datanya dalam bentuk JSON response ke frontend
    return NextResponse.json(sstData);
  } catch (error) {
    console.error("Gagal membaca file sst.json di server:", error);
    return NextResponse.json(
      { error: "Gagal memuat data suhu dari server internal" },
      { status: 500 },
    );
  }
}
