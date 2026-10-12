import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { uahToMinorUnits } from "@/lib/payments/currencies";
import { verifyPaidAmount } from "@/lib/payments/order-checkout";

function verifyPayoneerSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.PAYONEER_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-payoneer-signature") ??
    request.headers.get("x-payment-signature") ??
    "";

  if (process.env.PAYONEER_WEBHOOK_SECRET && !verifyPayoneerSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = String(body.status ?? body.paymentStatus ?? "").toLowerCase();
  const orderId = String(
    body.orderId ?? body.transactionId ?? body.reference ?? body.merchantReference ?? "",
  );
  const externalId = String(body.paymentId ?? body.id ?? body.transaction_id ?? orderId);
  const currency = String(body.currency ?? "USD").toUpperCase();
  const amountMinor = Number(body.amount ?? body.amountMinor ?? 0);

  if (!orderId || !["paid", "success", "completed", "charged"].includes(status)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const paidMinor =
    amountMinor > 0
      ? amountMinor
      : order.checkoutAmountMinor ??
        uahToMinorUnits(order.items.reduce((s, i) => s + i.priceUah, 0), currency);

  if (!verifyPaidAmount(order, order.items, paidMinor, currency)) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const result = await markOrderPaid(orderId, {
    paymentProvider: "payoneer",
    paymentExternalId: externalId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
