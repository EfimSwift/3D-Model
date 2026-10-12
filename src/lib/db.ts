import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { cache } from "react";
import type { CfEnv } from "@/lib/cloudflare/bindings";

const log =
  process.env.NODE_ENV === "development" ? (["error", "warn"] as const) : (["error"] as const);

/**
 * D1 + Prisma на Cloudflare Workers.
 * @see https://opennext.js.org/cloudflare/howtos/db
 */
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  const d1 = (env as CfEnv).DB;
  if (!d1) {
    throw new Error("Cloudflare D1 binding `DB` is missing");
  }
  return new PrismaClient({
    adapter: new PrismaD1(d1),
    log: [...log],
  });
});

/** Локальный SQLite (`npm run dev` без wrangler). */
export const getDbLocal = cache(() => new PrismaClient({ log: [...log] }));

export function getPrismaClient(): PrismaClient {
  try {
    getCloudflareContext();
    return getDb();
  } catch {
    return getDbLocal();
  }
}
