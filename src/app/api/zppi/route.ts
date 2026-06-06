import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface RawSpot {
  lat: number;
  lng: number;
  value: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fishType = searchParams.get("fish") ?? "umum";

    const chlorPath = path.join(process.cwd(), "src/data/chlorophyll.json");
    const sstPath = path.join(process.cwd(), "src/data/sst.json");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const chlorData: RawSpot[] = JSON.parse(
      fs.readFileSync(chlorPath, "utf-8"),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sstData: RawSpot[] = JSON.parse(fs.readFileSync(sstPath, "utf-8"));

    const sstMap = new Map<string, number>();
    sstData.forEach((spot) => {
      const key = `${spot.lat.toFixed(4)}_${spot.lng.toFixed(4)}`;
      sstMap.set(key, spot.value);
    });

    let wChlor = 0.45;
    let wSst = 0.35;
    let wTide = 0.2;

    if (fishType === "tongkol") {
      wChlor = 0.55;
      wSst = 0.25;
      wTide = 0.2;
    } else if (fishType === "tuna") {
      wChlor = 0.25;
      wSst = 0.55;
      wTide = 0.2;
    } else if (fishType === "kembung") {
      wChlor = 0.4;
      wSst = 0.3;
      wTide = 0.3;
    }

    const zppiData = chlorData
      .filter((cSpot) => cSpot.value > 0.01 && cSpot.lat < -6.15)
      .map((cSpot) => {
        const key = `${cSpot.lat.toFixed(4)}_${cSpot.lng.toFixed(4)}`;
        const sstValue = sstMap.get(key) ?? 29.0;

        let chlorScore = 0;
        if (cSpot.value > 1.0) chlorScore = 100;
        else if (cSpot.value > 0.5) chlorScore = 80;
        else if (cSpot.value > 0.2) chlorScore = 60;
        else chlorScore = 40;

        let sstScore = 0;
        if (sstValue >= 28.5 && sstValue <= 29.5) sstScore = 100;
        else if (sstValue > 29.5 && sstValue <= 30.5) sstScore = 75;
        else if (sstValue > 30.5) sstScore = 40;
        else sstScore = 50;

        const tideScore = 90;

        const cCont = Math.round(chlorScore * wChlor);
        const sCont = Math.round(sstScore * wSst);
        const tCont = Math.round(tideScore * wTide);
        const finalScore = cCont + sCont + tCont;

        return {
          lat: cSpot.lat,
          lng: cSpot.lng,
          value: finalScore,
          breakdown: {
            chlorValue: cSpot.value,
            sstValue: sstValue,
            chlorCont: cCont,
            sstCont: sCont,
            tideCont: tCont,
          },
        };
      });

    return NextResponse.json(zppiData);
  } catch (error) {
    console.error("Gagal menghitung scoring ZPPI:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
