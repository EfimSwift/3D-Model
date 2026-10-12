# Оплата картой (мультивалюта) + Payoneer

## Способы оплаты в магазине

| Провайдер | Назначение |
|-----------|------------|
| **Stripe Checkout** | Карты Visa/Mastercard и др. в **разных валютах** (USD, EUR, UAH, …) |
| **Payoneer Checkout** | Карты через Payoneer (embedded или hosted redirect) |
| **Тест** | Кнопка simulate-pay (только dev / `ENABLE_TEST_PAYMENT`) |

Данные карты **не проходят через ваш сервер** (PCI) — только редирект / iframe шлюза.

---

## 1. Stripe (рекомендуется для карт в любой валюте)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → API keys.
2. Секреты на воркере:

```powershell
npx wrangler secret put STRIPE_SECRET_KEY --env=""
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env=""
```

3. Webhook endpoint в Stripe Dashboard:

`https://ВАШ-ДОМЕН/api/webhooks/stripe`

События: `checkout.session.completed`

---

## 2. Payoneer Checkout

1. Бизнес-аккаунт Payoneer + [Developer Portal](https://checkoutdocs.payoneer.com/docs/api-reference).
2. Секреты:

```powershell
npx wrangler secret put PAYONEER_CLIENT_ID --env=""
npx wrangler secret put PAYONEER_CLIENT_SECRET --env=""
npx wrangler secret put PAYONEER_WEBHOOK_SECRET --env=""
```

3. Переменные (по желанию в `wrangler.jsonc` vars):

- `PAYONEER_SANDBOX` = `"true"` для теста
- `PAYONEER_DIVISION`, `PAYONEER_API_BASE`, `PAYONEER_CHECKOUT_API_BASE` — если отличаются от дефолта в `lib/payments/payoneer/client.ts`

4. Webhook URL:

`https://ВАШ-ДОМЕН/api/webhooks/payoneer`

Точный формат тела webhook уточните в документации Payoneer и при необходимости донастройте `api/webhooks/payoneer/route.ts`.

---

## 3. Курсы валют

Цены в каталоге в **UAH**. При оплате в USD/EUR сумма считается по таблице в `lib/payments/currencies.ts`.

Для продакшена задайте актуальные курсы:

```json
PAYMENT_FX_JSON={"UAH":1,"USD":0.024,"EUR":0.022}
```

(в `wrangler.jsonc` → `vars` или секрет)

---

## 4. Миграция D1 после обновления

Новые поля заказа: `checkoutCurrency`, `checkoutAmountMinor`.

```bash
npm run cf:db:schema
# применить prisma/cloudflare-schema.sql на remote D1 или ALTER вручную:
# ALTER TABLE Order ADD COLUMN checkoutCurrency TEXT;
# ALTER TABLE Order ADD COLUMN checkoutAmountMinor INTEGER;
npm run cf:db:migrate:remote
```

---

## 5. Проверка

1. `/checkout/…` → email → валюта → Stripe / Payoneer.
2. После оплаты webhook → заказ `PAID` → письмо / скачивание.

См. также `docs/PAYMENTS-SECURITY.md`.
