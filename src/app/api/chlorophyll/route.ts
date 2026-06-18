import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src/data/chlorophyll.json");
    const fileData = fs.readFileSync(filePath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const spots = JSON.parse(fileData);

    return NextResponse.json(spots);
  } catch (error) {
    console.error("Gagal membaca file JSON di server:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
