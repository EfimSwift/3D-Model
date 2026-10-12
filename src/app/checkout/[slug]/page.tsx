import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutPayment } from "@/components/CheckoutPayment";
import { getPrismaClient } from "@/lib/db";
import { formatUahFromDb } from "@/lib/format";
import { isTestPaymentAllowed } from "@/lib/security/test-payment";

type Params = { params: Promise<{ slug: string }> };

export default async function CheckoutPage({ params }: Params) {
  const { slug } = await params;
  const prisma = getPrismaClient();
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) notFound();

  const testPaymentEnabled = isTestPaymentAllowed();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href={`/products/${slug}`} className="text-sm text-studio-muted hover:text-studio-accent">
        ← Назад к превью
      </Link>
      <h1 className="font-display mt-4 text-2xl font-bold">Страница оплаты</h1>
      <CheckoutPayment
        productId={product.id}
        slug={product.slug}
        isDigital={product.type === "DIGITAL"}
        testPaymentEnabled={testPaymentEnabled}
        priceLabel={formatUahFromDb(product.priceUah)}
        priceUah={product.priceUah}
        title={product.title}
      />
    </div>
  );
}
