"use client";

import { useState } from "react";

export function DownloadPanel({
  productId,
  title,
  accessToken,
}: {
  productId: string;
  title: string;
  accessToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/download/request?productId=${productId}&access=${encodeURIComponent(accessToken)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Скачивание недоступно");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="studio-card rounded-2xl border border-studio-accent/30 p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-studio-accent">
        Оплата подтверждена
      </p>
      <h1 className="font-display mt-3 text-2xl font-bold">{title}</h1>
      <p className="mt-3 text-sm text-studio-muted">
        Архив с полной моделью. То же письмо мы отправили на ваш email.
      </p>
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className="studio-btn-primary mt-8 rounded-full px-10 py-3 text-sm disabled:opacity-60"
      >
        {loading ? "Готовим файл…" : "Скачать архив"}
      </button>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
