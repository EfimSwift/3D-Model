import { NextResponse } from "next/server";
import { CHECKOUT_CURRENCIES, uahToMinorUnits, formatMoney } from "@/lib/payments/currencies";
import { getEnabledPaymentProviders, providerLabel } from "@/lib/payments/providers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const priceUah = Number(url.searchParams.get("priceUah") ?? "0");

  const providers = getEnabledPaymentProviders().map((id) => ({
    id,
    label: providerLabel(id),
  }));

  const currencies = CHECKOUT_CURRENCIES.map((c) => {
    const minor = priceUah > 0 ? uahToMinorUnits(priceUah, c.code) : 0;
    return {
      code: c.code,
      label: c.label,
      amountMinor: minor,
      formatted: priceUah > 0 ? formatMoney(minor, c.code) : null,
    };
  });

  return NextResponse.json({ providers, currencies });
}
