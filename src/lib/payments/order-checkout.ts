import { OrderStatus } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
import { minorUnitFactor, uahToMinorUnits, type CheckoutCurrency } from "@/lib/payments/currencies";

export async function loadPendingOrderForCheckout(orderId: string) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order || order.status !== OrderStatus.PENDING) return null;
  const item = order.items[0];
  if (!item?.product) return null;
  return { order, item };
}

export function resolveCheckoutAmount(priceUah: number, currency: CheckoutCurrency) {
  const amountMinor = uahToMinorUnits(priceUah, currency);
  return { currency, amountMinor, factor: minorUnitFactor(currency) };
}

export async function persistCheckoutAmount(
  orderId: string,
  currency: string,
  amountMinor: number,
) {
  const prisma = getPrismaClient();
  await prisma.order.update({
    where: { id: orderId },
    data: { checkoutCurrency: currency, checkoutAmountMinor: amountMinor },
  });
}

export function verifyPaidAmount(
  order: { checkoutAmountMinor: number | null; checkoutCurrency: string | null },
  items: { priceUah: number }[],
  paidMinor: number,
  paidCurrency: string,
): boolean {
  const expectedMinor =
    order.checkoutAmountMinor ??
    uahToMinorUnits(items.reduce((s, i) => s + i.priceUah, 0), paidCurrency);
  const expectedCurrency = order.checkoutCurrency ?? paidCurrency;
  return (
    expectedCurrency.toUpperCase() === paidCurrency.toUpperCase() &&
    expectedMinor === paidMinor
  );
}
