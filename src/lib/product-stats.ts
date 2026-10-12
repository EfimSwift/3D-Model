import { getPrismaClient } from "@/lib/db";

export type ProductStats = {
  purchaseCount: number;
  downloadCount: number;
};

const emptyStats = (): ProductStats => ({ purchaseCount: 0, downloadCount: 0 });

export async function getProductStatsMap(
  productIds: string[],
): Promise<Map<string, ProductStats>> {
  const map = new Map<string, ProductStats>();
  for (const id of productIds) {
    map.set(id, emptyStats());
  }
  if (productIds.length === 0) return map;

  const prisma = getPrismaClient();
  const [purchaseGroups, downloadGroups] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        order: { status: "PAID" },
      },
      _count: { _all: true },
    }),
    prisma.downloadGrant.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        usedAt: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  for (const row of purchaseGroups) {
    const current = map.get(row.productId) ?? emptyStats();
    current.purchaseCount = row._count._all;
    map.set(row.productId, current);
  }

  for (const row of downloadGroups) {
    const current = map.get(row.productId) ?? emptyStats();
    current.downloadCount = row._count._all;
    map.set(row.productId, current);
  }

  return map;
}

export async function getProductStats(productId: string): Promise<ProductStats> {
  const map = await getProductStatsMap([productId]);
  return map.get(productId) ?? emptyStats();
}
