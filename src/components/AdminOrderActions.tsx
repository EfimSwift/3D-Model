"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminOrderActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markPaid() {
    setLoading(true);
    await fetch(`/api/admin/orders/${orderId}/mark-paid`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={markPaid}
      disabled={loading}
      className="mt-3 rounded-full border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      Отметить оплаченным
    </button>
  );
}
