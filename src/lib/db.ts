import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCfEnv, isCloudflareWorkerRuntime } from "@/lib/cloudflare/bindings";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const log =
    process.env.NODE_ENV === "development" ? (["error", "warn"] as const) : (["error"] as const);

  const cf = getCfEnv();
  if (cf?.DB) {
    return new PrismaClient({
      adapter: new PrismaD1(cf.DB),
      log: [...log],
    });
  }

  if (isCloudflareWorkerRuntime()) {
    throw new Error("D1 binding DB is missing in Cloudflare env");
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
