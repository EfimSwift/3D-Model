"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  productId: string;
  slug: string;
  isDigital: boolean;
  testPaymentEnabled: boolean;
  priceLabel: string;
  title: string;
};

export function CheckoutPayment({
  productId,
  slug,
  isDigital,
  testPaymentEnabled,
  priceLabel,
  title,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "paid">("idle");

  async function createOrder() {
    setLoading(true);
    setError(null);
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

  return (
    <div className="space-y-6">
      <div className="studio-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Оплата</h2>
        <p className="mt-1 text-sm text-studio-muted">{title}</p>
        <p className="mt-4 text-3xl font-semibold text-studio-accent">{priceLabel}</p>

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
        <p className="mt-2 text-xs text-studio-muted">
          После оплаты отправим письмо с подтверждением
          {isDigital ? " и ссылкой на скачивание модели" : " и статусом заказа на фигурку"}.
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

        <div className="mt-6 space-y-3 opacity-50">
          <div className="h-11 rounded-xl border border-studio-border bg-studio-bg/50" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-11 rounded-xl border border-studio-border bg-studio-bg/50" />
            <div className="h-11 rounded-xl border border-studio-border bg-studio-bg/50" />
          </div>
        </div>
      </div>

      {testPaymentEnabled && orderId && (
        <button
          type="button"
          onClick={confirmTestPayment}
          disabled={loading || status === "paid"}
          className="studio-btn-primary w-full rounded-full py-3 text-sm disabled:opacity-60"
        >
          {status === "checking"
            ? "Проверяем поступление…"
            : loading
              ? "Подождите…"
              : "Тест: оплата прошла успешно"}
        </button>
      )}

      {!testPaymentEnabled && orderId && (
        <p className="text-center text-sm text-studio-muted">
          Ожидание платёжного шлюза. Заказ № {orderId}
        </p>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
