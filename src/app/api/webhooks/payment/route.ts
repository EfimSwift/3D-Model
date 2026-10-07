import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/mark-paid";

/**
 * Заготовка под LiqPay / WayForPay: статус PAID ставится ТОЛЬКО после проверенного webhook.
 * Клиентский фронт не может вызвать этот endpoint без подписи.
 */
export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature") ?? "";

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    externalPaymentId?: string;
    provider?: string;
    status?: string;
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.status !== "success" || !body.orderId || !body.externalPaymentId || !body.provider) {
    return NextResponse.json({ error: "Ignored" }, { status: 200 });
  }

  const result = await markOrderPaid(body.orderId, {
    paymentProvider: body.provider,
    paymentExternalId: body.externalPaymentId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
