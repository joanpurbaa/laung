import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src/data/sst.json");

    const fileData = fs.readFileSync(filePath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sstData = JSON.parse(fileData);

    return NextResponse.json(sstData);
  } catch (error) {
    console.error("Gagal membaca file sst.json di server:", error);
    return NextResponse.json(
      { error: "Gagal memuat data suhu dari server internal" },
      { status: 500 },
    );
  }
}
