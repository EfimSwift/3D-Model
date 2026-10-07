import { sendPurchaseNotification } from "@/lib/email/purchase-notifications";

export async function onOrderPaid(orderId: string) {
  await sendPurchaseNotification(orderId);
}
