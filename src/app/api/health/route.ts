import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import type { CfEnv } from "@/lib/cloudflare/bindings";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ready = url.searchParams.get("ready") === "1";
  const debug = url.searchParams.get("debug") === "1";

  if (!ready) {
    const payload: Record<string, unknown> = {
      status: "ok",
      service: "figurki-shop",
      ts: new Date().toISOString(),
    };
    if (debug) {
      try {
        const { env } = getCloudflareContext();
        const cf = env as CfEnv;
        payload.cf = { hasDb: Boolean(cf.DB), hasR2: Boolean(cf.MODELS_BUCKET) };
      } catch (e) {
        payload.cf = { error: e instanceof Error ? e.message : String(e) };
      }
    }
    return NextResponse.json(payload);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", db: "ok" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ status: "not_ready", db: "error", message }, { status: 503 });
  }
}
