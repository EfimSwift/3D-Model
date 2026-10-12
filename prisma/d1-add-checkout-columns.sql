-- Применить на remote D1 после деплоя оплаты:
-- npx wrangler d1 execute figurki-3d-dev --remote --file=prisma/d1-add-checkout-columns.sql
ALTER TABLE "Order" ADD COLUMN "checkoutCurrency" TEXT;
ALTER TABLE "Order" ADD COLUMN "checkoutAmountMinor" INTEGER;
