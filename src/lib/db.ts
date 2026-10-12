import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCfEnv } from "@/lib/cloudflare/bindings";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const log =
    process.env.NODE_ENV === "development" ? (["error", "warn"] as const) : (["error"] as const);

  const d1 = getCfEnv()?.DB;
  if (d1) {
    return new PrismaClient({
      adapter: new PrismaD1(d1),
      log: [...log],
    });
  }

  return new PrismaClient({ log: [...log] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
