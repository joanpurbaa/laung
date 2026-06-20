import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target, message } = body;

    if (!target || !message) {
      return NextResponse.json(
        { status: false, reason: "Target dan pesan wajib diisi" },
        { status: 400 },
      );
    }

    const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

    const formData = new URLSearchParams();
    formData.append("target", target);
    formData.append("message", message);
    formData.append("countryCode", "62");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN.trim(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("🚨 Error API Route WhatsApp:", error);
    return NextResponse.json(
      { status: false, reason: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
