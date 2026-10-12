import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CfEnv } from "@/lib/cloudflare/bindings";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function isDeployedWorker(): boolean {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").includes("workers.dev");
}

function createPrismaClient(): PrismaClient {
  const log =
    process.env.NODE_ENV === "development" ? (["error", "warn"] as const) : (["error"] as const);

  try {
    const { env } = getCloudflareContext();
    const d1 = (env as CfEnv).DB;
    if (d1) {
      return new PrismaClient({
        adapter: new PrismaD1(d1),
        log: [...log],
      });
    }
    if (isDeployedWorker()) {
      throw new Error("Cloudflare D1 binding `DB` is not available in env");
    }
  } catch (e) {
    if (isDeployedWorker()) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  return new PrismaClient({ log: [...log] });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Ленивая инициализация: на Workers D1 доступен только во время запроса
 * (AsyncLocalStorage в OpenNext), не при загрузке модуля.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
