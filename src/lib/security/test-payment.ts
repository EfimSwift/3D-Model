/**
 * Тестовая «оплата» никогда не должна быть доступна на боевом сайте без явного флага.
 */
export function isTestPaymentAllowed(): boolean {
  if (process.env.ENABLE_TEST_PAYMENT !== "true") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return process.env.ALLOW_TEST_PAYMENT_IN_PRODUCTION === "true";
  }
  return true;
}
