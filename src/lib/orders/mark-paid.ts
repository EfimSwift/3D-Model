import { OrderStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { onOrderPaid } from "@/lib/orders/notify-paid";

export type MarkPaidMeta = {
  paymentProvider: string;
  paymentExternalId: string;
};

/**
 * Единственная точка перевода заказа в PAID (кроме прямого вызова из webhook/admin).
 * Идемпотентна: повторный вызов с тем же заказом не ломает состояние.
 */
export async function markOrderPaid(orderId: string, meta: MarkPaidMeta) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { ok: false as const, error: "ORDER_NOT_FOUND" };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { ok: false as const, error: "ORDER_CANCELLED" };
  }

  if (order.status === OrderStatus.PAID) {
    return { ok: true as const, order, alreadyPaid: true };
  }

  if (order.status !== OrderStatus.PENDING) {
    return { ok: false as const, error: "INVALID_STATUS" };
  }

  const duplicateExternal = await prisma.order.findFirst({
    where: {
      paymentExternalId: meta.paymentExternalId,
      id: { not: orderId },
    },
  });
  if (duplicateExternal) {
    return { ok: false as const, error: "DUPLICATE_PAYMENT_ID" };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.PAID,
      paidAt: new Date(),
      paymentProvider: meta.paymentProvider,
      paymentExternalId: meta.paymentExternalId,
    },
    include: { items: { include: { product: true } } },
  });

  await onOrderPaid(orderId);

  return { ok: true as const, order: updated, alreadyPaid: false };
}
