import { OrderStatus, ProductType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { orderHasPaidProduct } from "@/lib/purchases";

export async function canDownloadDigitalForOrder(
  orderId: string,
  email: string,
  productId: string,
): Promise<boolean> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.type !== ProductType.DIGITAL || !product.privateFilePath) {
    return false;
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerEmail: email.trim().toLowerCase(),
      status: OrderStatus.PAID,
    },
  });
  if (!order) return false;

  return orderHasPaidProduct(orderId, productId);
}
