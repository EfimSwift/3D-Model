import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import type { CfEnv } from "@/lib/cloudflare/bindings";
import { getPrismaClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Диагностика D1/Prisma на проде (без секретов). */
export async function GET() {
  const out: Record<string, unknown> = {
    ts: new Date().toISOString(),
    nextRuntime: process.env.NEXT_RUNTIME ?? null,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrlPrefix: process.env.DATABASE_URL?.slice(0, 12) ?? null,
  };

  try {
    const { env } = getCloudflareContext();
    const cf = env as CfEnv;
    out.cloudflare = {
      hasDb: Boolean(cf.DB),
      hasR2: Boolean(cf.MODELS_BUCKET),
      dbType: cf.DB ? typeof cf.DB : null,
    };

    if (cf.DB) {
      try {
        const row = await cf.DB.prepare("SELECT COUNT(*) AS n FROM Product").first<{ n: number }>();
        out.d1Raw = { productCount: row?.n ?? null, ok: true };
      } catch (e) {
        out.d1Raw = { ok: false, error: e instanceof Error ? e.message : String(e) };
      }

      try {
        const prisma = new PrismaClient({ adapter: new PrismaD1(cf.DB), log: ["error"] });
        const count = await prisma.product.count();
        await prisma.$disconnect();
        out.prismaFreshAdapter = { ok: true, productCount: count };
      } catch (e) {
        out.prismaFreshAdapter = {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }
  } catch (e) {
    out.cloudflare = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const prisma = getPrismaClient();
    const count = await prisma.product.count();
    out.getPrismaClient = { ok: true, productCount: count };
  } catch (e) {
    out.getPrismaClient = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(out);
}
