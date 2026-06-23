import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pruneStaleSharelock } from "~/lib/actions/location";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pruneStaleSharelock();
  return NextResponse.json({ success: true });
}
