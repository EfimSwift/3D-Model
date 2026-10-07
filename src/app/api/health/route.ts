import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ready = url.searchParams.get("ready") === "1";

  if (!ready) {
    return NextResponse.json({
      status: "ok",
      service: "figurki-shop",
      ts: new Date().toISOString(),
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", db: "ok" });
  } catch {
    return NextResponse.json({ status: "not_ready", db: "error" }, { status: 503 });
  }
}
