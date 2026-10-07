import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { prisma } from "@/lib/db";
import { isTestPaymentAllowed } from "@/lib/security/test-payment";

type Params = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, { params }: Params) {
  if (!isTestPaymentAllowed()) {
    return NextResponse.json({ error: "Тестовая оплата отключена" }, { status: 403 });
  }

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const result = await markOrderPaid(orderId, {
    paymentProvider: "test",
    paymentExternalId: `test_${orderId}`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "PAID" });
}
