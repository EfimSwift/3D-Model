import { isTestPaymentAllowed } from "@/lib/security/test-payment";

export type PaymentProviderId = "stripe" | "payoneer" | "test";

export function getEnabledPaymentProviders(): PaymentProviderId[] {
  const out: PaymentProviderId[] = [];
  if (process.env.STRIPE_SECRET_KEY) out.push("stripe");
  if (process.env.PAYONEER_CLIENT_ID && process.env.PAYONEER_CLIENT_SECRET) {
    out.push("payoneer");
  }
  if (isTestPaymentAllowed()) out.push("test");
  return out;
}

export function providerLabel(id: PaymentProviderId): string {
  switch (id) {
    case "stripe":
      return "Банковская карта (Visa, Mastercard…)";
    case "payoneer":
      return "Payoneer Checkout";
    case "test":
      return "Тестовая оплата";
  }
}
