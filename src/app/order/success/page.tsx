import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { signOrderAccessToken } from "@/lib/order-access-token";

type Props = { searchParams: Promise<{ orderId?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;
  if (!orderId) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.status !== "PAID") notFound();

  const item = order.items[0];
  if (!item) notFound();

  const product = item.product;
  const access = await signOrderAccessToken({
    orderId: order.id,
    email: order.customerEmail,
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-studio-accent">
        Спасибо за покупку
      </p>
      <h1 className="font-display mt-3 text-2xl font-bold">Оплата прошла успешно</h1>
      <p className="mt-4 text-sm text-studio-muted">
        Письмо с подтверждением отправлено на{" "}
        <span className="text-studio-text">{order.customerEmail}</span>.
      </p>

      {product.type === "DIGITAL" && (
        <Link
          href={`/downloads/${product.slug}?access=${encodeURIComponent(access)}`}
          className="studio-btn-primary mt-8 inline-flex rounded-full px-8 py-3 text-sm"
        >
          Скачать модель сейчас
        </Link>
      )}

      {product.type === "PHYSICAL" && (
        <p className="mt-6 text-sm text-studio-muted">
          Заказ на фигурку «{product.title}» принят. Детали доставки — в письме.
        </p>
      )}

      <Link href="/" className="mt-8 block text-sm text-studio-accent hover:underline">
        Вернуться в каталог
      </Link>
    </div>
  );
}
