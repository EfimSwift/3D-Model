import { NextResponse } from "next/server";
import {
  isCheckoutCurrency,
  type CheckoutCurrency,
} from "@/lib/payments/currencies";
import {
  loadPendingOrderForCheckout,
  persistCheckoutAmount,
  resolveCheckoutAmount,
} from "@/lib/payments/order-checkout";
import { createPayoneerCheckoutSession } from "@/lib/payments/payoneer/client";
import { createStripeCheckoutSession } from "@/lib/payments/stripe/checkout";
import type { PaymentProviderId } from "@/lib/payments/providers";

type Params = { params: Promise<{ orderId: string }> };

function appUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export async function POST(request: Request, { params }: Params) {
  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const provider = body?.provider as PaymentProviderId | undefined;
  const currencyRaw = typeof body?.currency === "string" ? body.currency : "UAH";

  if (!provider || !["stripe", "payoneer"].includes(provider)) {
    return NextResponse.json({ error: "Укажите provider: stripe или payoneer" }, { status: 400 });
  }
  if (!isCheckoutCurrency(currencyRaw)) {
    return NextResponse.json({ error: "Неподдерживаемая валюта" }, { status: 400 });
  }
  const currency: CheckoutCurrency = currencyRaw;

  const loaded = await loadPendingOrderForCheckout(orderId);
  if (!loaded) {
    return NextResponse.json({ error: "Заказ не найден или уже оплачен" }, { status: 404 });
  }

  const { order, item } = loaded;
  const { amountMinor } = resolveCheckoutAmount(item.priceUah, currency);
  await persistCheckoutAmount(orderId, currency, amountMinor);

  const slug = item.product.slug;
  const base = appUrl();

  try {
    if (provider === "stripe") {
      const { url, sessionId } = await createStripeCheckoutSession({
        orderId,
        email: order.customerEmail,
        productTitle: item.product.title,
        currency,
        amountMinor,
        successUrl: `${base}/order/success?orderId=${orderId}`,
        cancelUrl: `${base}/checkout/${slug}?cancelled=1`,
      });
      return NextResponse.json({ provider, redirectUrl: url, externalId: sessionId });
    }

    const payoneer = await createPayoneerCheckoutSession({
      orderId,
      email: order.customerEmail,
      currency,
      amountMinor,
      description: item.product.title,
      returnUrl: `${base}/order/success?orderId=${orderId}`,
      cancelUrl: `${base}/checkout/${slug}?cancelled=1`,
    });

    if (payoneer.hostedPaymentUrl) {
      return NextResponse.json({
        provider,
        redirectUrl: payoneer.hostedPaymentUrl,
        externalId: payoneer.longId,
      });
    }

    return NextResponse.json({
      provider: "payoneer",
      embedded: true,
      longId: payoneer.longId,
      env: payoneer.env,
      listUrl: payoneer.listUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
