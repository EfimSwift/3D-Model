/** Валюты для оплаты картой (ISO 4217). Базовая цена в каталоге — UAH. */
export const CHECKOUT_CURRENCIES = [
  { code: "UAH", label: "₴ Гривня" },
  { code: "USD", label: "$ Доллар" },
  { code: "EUR", label: "€ Евро" },
  { code: "GBP", label: "£ Фунт" },
  { code: "PLN", label: "zł Злотый" },
  { code: "CAD", label: "C$ Канада" },
  { code: "AUD", label: "A$ Австралия" },
] as const;

export type CheckoutCurrency = (typeof CHECKOUT_CURRENCIES)[number]["code"];

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND"]);

/** Курс: 1 UAH → валюта (приблизительно; для продакшена подключите FX API). */
function rateFromUah(currency: string): number {
  const raw = process.env.PAYMENT_FX_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (typeof parsed[currency] === "number") return parsed[currency];
      if (typeof parsed.UAH === "number" && currency === "UAH") return 1;
    } catch {
      /* ignore */
    }
  }
  const table: Record<string, number> = {
    UAH: 1,
    USD: 0.024,
    EUR: 0.022,
    GBP: 0.019,
    PLN: 0.095,
    CAD: 0.033,
    AUD: 0.037,
  };
  return table[currency] ?? table.USD;
}

export function minorUnitFactor(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 1 : 100;
}

/** Сумма для шлюза в minor units (центы и т.д.). */
export function uahToMinorUnits(priceUah: number, currency: string): number {
  const major = priceUah * rateFromUah(currency);
  const factor = minorUnitFactor(currency);
  return Math.max(1, Math.round(major * factor));
}

export function formatMoney(minor: number, currency: string): string {
  const factor = minorUnitFactor(currency);
  const major = minor / factor;
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: factor === 1 ? 0 : 2,
  }).format(major);
}

export function isCheckoutCurrency(code: string): code is CheckoutCurrency {
  return CHECKOUT_CURRENCIES.some((c) => c.code === code);
}
