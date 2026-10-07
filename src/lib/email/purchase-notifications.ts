import { ProductType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { signOrderAccessToken } from "@/lib/order-access-token";

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Отправка письма о платеже и покупке.
 * Сейчас: лог в консоль (dev). Подключите SMTP / Resend / SendGrid через env.
 */
export async function sendPurchaseNotification(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.status !== "PAID") return;

  const email = order.customerEmail;
  const access = await signOrderAccessToken({ orderId: order.id, email });
  const item = order.items[0];
  if (!item) return;

  const product = item.product;
  const lines: string[] = [
    `Здравствуйте!`,
    ``,
    `Оплата получена. Заказ № ${order.id}.`,
    `Товар: ${product.title}`,
    `Сумма: ${item.priceUah} ₴`,
    ``,
  ];

  if (product.type === ProductType.DIGITAL) {
    lines.push(
      `Скачать архив модели:`,
      `${baseUrl()}/downloads/${product.slug}?access=${encodeURIComponent(access)}`,
      ``,
      `Ссылка также будет действовать из письма в течение 30 дней.`,
    );
  } else {
    lines.push(
      `Заказ на фигурку принят в работу. Мы свяжемся с вами по этому email для доставки.`,
    );
  }

  const body = lines.join("\n");
  const subject =
    product.type === ProductType.DIGITAL
      ? `Figurki.studio — оплата и ссылка на модель`
      : `Figurki.studio — оплата заказа на фигурку`;

  // TODO: nodemailer / Resend / AWS SES
  if (process.env.SMTP_HOST) {
    console.info("[email] SMTP configured — integrate sender in lib/email/smtp.ts");
  }

  console.info("--- PURCHASE EMAIL (dev) ---");
  console.info(`To: ${email}`);
  console.info(`Subject: ${subject}`);
  console.info(body);
  console.info("----------------------------");
}
