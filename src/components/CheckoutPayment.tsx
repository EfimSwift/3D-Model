"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PayoneerCheckoutEmbed } from "@/components/PayoneerCheckoutEmbed";

type Provider = { id: string; label: string };
type CurrencyOption = {
  code: string;
  label: string;
  amountMinor: number;
  formatted: string | null;
};

type Props = {
  productId: string;
  slug: string;
  isDigital: boolean;
  testPaymentEnabled: boolean;
  priceLabel: string;
  priceUah: number;
  title: string;
};

export function CheckoutPayment({
  productId,
  slug,
  isDigital,
  testPaymentEnabled,
  priceLabel,
  priceUah,
  title,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "paid">("idle");

  const [providers, setProviders] = useState<Provider[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [currency, setCurrency] = useState("UAH");
  const [provider, setProvider] = useState<string>("stripe");
  const [payoneerEmbed, setPayoneerEmbed] = useState<{
    longId: string;
    env: "test" | "live";
  } | null>(null);

  useEffect(() => {
    fetch(`/api/payments/options?priceUah=${priceUah}`)
      .then((r) => r.json())
      .then((data) => {
        setProviders(data.providers ?? []);
        setCurrencies(data.currencies ?? []);
        if (data.providers?.[0]?.id) setProvider(data.providers[0].id);
      })
      .catch(() => {});
  }, [priceUah]);

  const selectedFormatted =
    currencies.find((c) => c.code === currency)?.formatted ?? priceLabel;

  async function createOrder() {
    setLoading(true);
    setError(null);
    setPayoneerEmbed(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось создать заказ");
        return;
      }
      setOrderId(data.orderId);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  const startCheckout = useCallback(async () => {
    if (!orderId) return;
    if (provider === "test") return;
    setLoading(true);
    setError(null);
    setPayoneerEmbed(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось начать оплату");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.embedded && data.longId) {
        setPayoneerEmbed({ longId: data.longId, env: data.env ?? "test" });
        return;
      }
      setError("Платёжный шлюз не вернул ссылку");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }, [orderId, provider, currency]);

  async function confirmTestPayment() {
    if (!orderId) return;
    setLoading(true);
    setStatus("checking");
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/simulate-pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Оплата не подтверждена");
        setStatus("idle");
        return;
      }
      setStatus("paid");
      router.push(`/order/success?orderId=${orderId}`);
      router.refresh();
    } catch {
      setError("Ошибка сети");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }

  const cardProviders = providers.filter((p) => p.id === "stripe" || p.id === "payoneer");
  const showRealPay = cardProviders.length > 0 && orderId;

  return (
    <div className="space-y-6">
      <div className="studio-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Оплата</h2>
        <p className="mt-1 text-sm text-studio-muted">{title}</p>
        <p className="mt-4 text-3xl font-semibold text-studio-accent">{selectedFormatted}</p>
        <p className="mt-1 text-xs text-studio-muted">Базовая цена: {priceLabel}</p>

        <label className="mt-6 flex flex-col gap-1.5 text-sm text-studio-muted">
          Email для чека и ссылки на покупку
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="studio-input rounded-xl px-3 py-2.5"
            placeholder="you@example.com"
            disabled={Boolean(orderId)}
          />
        </label>

        {orderId && cardProviders.length > 0 && (
          <>
            <label className="mt-4 flex flex-col gap-1.5 text-sm text-studio-muted">
              Валюта оплаты
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="studio-input rounded-xl px-3 py-2.5"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                    {c.formatted ? ` — ${c.formatted}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <p className="mt-4 text-sm font-medium text-studio-text">Способ оплаты</p>
            <div className="mt-2 flex flex-col gap-2">
              {cardProviders.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-studio-border px-3 py-2.5"
                >
                  <input
                    type="radio"
                    name="pay-provider"
                    value={p.id}
                    checked={provider === p.id}
                    onChange={() => setProvider(p.id)}
                  />
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <p className="mt-2 text-xs text-studio-muted">
          Карта вводится только на стороне Stripe или Payoneer — мы не храним данные карты.
        </p>

        {!orderId && (
          <button
            type="button"
            onClick={createOrder}
            disabled={loading || !email}
            className="studio-btn-primary mt-4 w-full rounded-full py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Подождите…" : "Продолжить к оплате"}
          </button>
        )}

        {orderId && (
          <p className="mt-4 text-sm text-studio-accent">Заказ создан. Завершите оплату ниже.</p>
        )}
      </div>

      {showRealPay && provider !== "test" && (
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading}
          className="studio-btn-primary w-full rounded-full py-3 text-sm disabled:opacity-60"
        >
          {loading ? "Подключение к платёжному шлюзу…" : "Оплатить картой"}
        </button>
      )}

      {payoneerEmbed && (
        <PayoneerCheckoutEmbed
          longId={payoneerEmbed.longId}
          env={payoneerEmbed.env}
          onError={(msg) => setError(msg)}
        />
      )}

      {testPaymentEnabled && orderId && (
        <button
          type="button"
          onClick={confirmTestPayment}
          disabled={loading || status === "paid"}
          className="studio-btn-ghost w-full rounded-full border border-dashed border-studio-border py-3 text-sm disabled:opacity-60"
        >
          {status === "checking"
            ? "Проверяем поступление…"
            : loading
              ? "Подождите…"
              : "Тест: оплата прошла успешно"}
        </button>
      )}

      {orderId && cardProviders.length === 0 && !testPaymentEnabled && (
        <p className="text-center text-sm text-amber-400/90">
          Платёжные ключи не настроены. Добавьте Stripe или Payoneer в секреты воркера (см.
          docs/PAYMENTS-SETUP.md).
        </p>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
