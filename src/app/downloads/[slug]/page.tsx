import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadPanel } from "@/components/DownloadPanel";
import { prisma } from "@/lib/db";
import { canDownloadDigitalForOrder } from "@/lib/access";
import { verifyOrderAccessToken } from "@/lib/order-access-token";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
};

export default async function DownloadPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { access } = await searchParams;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product || product.type !== "DIGITAL") notFound();

  if (!access) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold">Ссылка из письма</h1>
        <p className="mt-3 text-sm text-studio-muted">
          Скачивание доступно только по персональной ссылке после оплаты. Проверьте почту.
        </p>
        <Link href="/" className="mt-6 inline-block text-studio-accent hover:underline">
          В каталог
        </Link>
      </div>
    );
  }

  const payload = await verifyOrderAccessToken(access);
  if (!payload) notFound();

  const allowed = await canDownloadDigitalForOrder(
    payload.orderId,
    payload.email,
    product.id,
  );
  if (!allowed) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/" className="text-sm text-studio-muted hover:text-studio-accent">
        ← В каталог
      </Link>
      <p className="mt-4 text-sm text-studio-muted">Покупка для {payload.email}</p>
      <div className="mt-6">
        <DownloadPanel productId={product.id} title={product.title} accessToken={access} />
      </div>
    </div>
  );
}
