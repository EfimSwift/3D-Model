"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  longId: string;
  env: "test" | "live";
  onError?: (message: string) => void;
};

export function PayoneerCheckoutEmbed({ longId, env, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!containerRef.current || !longId) return;
      try {
        const { CheckoutWeb } = await import("@payoneer/checkout-web");
        const checkout = await CheckoutWeb({ env, longId });
        if (!mounted || !containerRef.current) return;
        const cards = checkout.dropIn("cards");
        cards?.mount(containerRef.current);
        setStatus("ready");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Payoneer widget error";
        setStatus("error");
        onError?.(msg);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [longId, env, onError]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="min-h-[120px] rounded-xl border border-studio-border bg-studio-bg/40 p-2"
      />
      {status === "loading" && (
        <p className="text-center text-xs text-studio-muted">Загрузка Payoneer…</p>
      )}
      {status === "error" && (
        <p className="text-center text-xs text-red-400">
          Не удалось загрузить форму Payoneer. Попробуйте редирект или Stripe.
        </p>
      )}
    </div>
  );
}
