/**
 * Payoneer Checkout — серверная сессия оплаты.
 * @see https://checkoutdocs.payoneer.com/docs/api-reference
 * @see https://www.npmjs.com/package/@payoneer/checkout-web
 */

type PayoneerTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

function apiBase(): string {
  if (process.env.PAYONEER_API_BASE) return process.env.PAYONEER_API_BASE.replace(/\/$/, "");
  return process.env.PAYONEER_SANDBOX === "true"
    ? "https://api.sandbox.payoneer.com"
    : "https://api.payoneer.com";
}

function checkoutApiBase(): string {
  if (process.env.PAYONEER_CHECKOUT_API_BASE) {
    return process.env.PAYONEER_CHECKOUT_API_BASE.replace(/\/$/, "");
  }
  return process.env.PAYONEER_SANDBOX === "true"
    ? "https://api.sandbox.oscato.com"
    : "https://api.live.oscato.com";
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYONEER_CLIENT_ID;
  const clientSecret = process.env.PAYONEER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYONEER_CLIENT_ID / PAYONEER_CLIENT_SECRET missing");
  }

  const tokenUrl =
    process.env.PAYONEER_TOKEN_URL ?? `${apiBase()}/v4/oauth/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payoneer token failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as PayoneerTokenResponse;
  return json.access_token;
}

export type PayoneerCheckoutSession = {
  /** longId для @payoneer/checkout-web */
  longId: string;
  env: "test" | "live";
  listUrl?: string;
  hostedPaymentUrl?: string;
};

export async function createPayoneerCheckoutSession(input: {
  orderId: string;
  email: string;
  currency: string;
  amountMinor: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayoneerCheckoutSession> {
  const token = await getAccessToken();
  const division = process.env.PAYONEER_DIVISION ?? "checkout";
  const listPath = process.env.PAYONEER_LIST_PATH ?? "/v2/lists";

  const payload = {
    division,
    transactionId: input.orderId,
    customer: { email: input.email },
    payment: {
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.orderId,
      description: input.description,
    },
    callback: {
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/api/webhooks/payoneer`,
    },
  };

  const res = await fetch(`${checkoutApiBase()}${listPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Payoneer list session failed (${res.status}): ${text.slice(0, 300)}`);
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Payoneer list: invalid JSON response");
  }

  const longId =
    (json.longId as string) ??
    (json.long_id as string) ??
    (json.identification as { longId?: string })?.longId;
  const listUrl = (json.links as { self?: string })?.self ?? (json.listUrl as string);
  const hostedPaymentUrl =
    (json.hostedPaymentUrl as string) ?? (json.redirectUrl as string);

  if (!longId && !hostedPaymentUrl && !listUrl) {
    throw new Error("Payoneer response missing longId / redirect URL");
  }

  const env = process.env.PAYONEER_SANDBOX === "true" ? "test" : "live";

  return {
    longId: longId ?? "",
    env,
    listUrl,
    hostedPaymentUrl,
  };
}
