import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function orderHasPaidProduct(
  orderId: string,
  productId: string,
): Promise<boolean> {
  const item = await prisma.orderItem.findFirst({
    where: {
      orderId,
      productId,
      order: { status: OrderStatus.PAID },
    },
  });
  return Boolean(item);
}

export async function emailHasPaidProduct(
  email: string,
  productId: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        customerEmail: normalized,
        status: OrderStatus.PAID,
      },
    },
  });
  return Boolean(item);
}
