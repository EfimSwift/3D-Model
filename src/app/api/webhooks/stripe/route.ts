import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { verifyPaidAmount } from "@/lib/payments/order-checkout";
import { constructStripeEvent } from "@/lib/payments/stripe/checkout";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (!orderId || session.payment_status !== "paid") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const prisma = getPrismaClient();
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const paidMinor = session.amount_total ?? 0;
    const paidCurrency = (session.currency ?? "uah").toUpperCase();
    if (!verifyPaidAmount(order, order.items, paidMinor, paidCurrency)) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const result = await markOrderPaid(orderId, {
      paymentProvider: "stripe",
      paymentExternalId: session.id,
    });
    if (!result.ok && result.error !== undefined) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}
