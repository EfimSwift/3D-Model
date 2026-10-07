import Link from "next/link";
import { notFound } from "next/navigation";
import { ModelViewer } from "@/components/ModelViewer";
import { ProductPayButton } from "@/components/ProductPayButton";
import { ProductShowcaseImage } from "@/components/ProductShowcaseImage";
import { prisma } from "@/lib/db";
import { formatUahFromDb } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) notFound();

  const isDigital = product.type === "DIGITAL";
  const typeLabel = isDigital ? "3D модель" : "На заказ";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="text-sm text-studio-muted hover:text-studio-accent">
        ← Каталог
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="studio-card overflow-hidden rounded-2xl">
          <div className="studio-viewport aspect-square">
            <div className="studio-viewport-shine" aria-hidden />
            <div className="relative z-[1] h-full w-full">
              {isDigital && product.previewGlbPath ? (
                <ModelViewer
                  src={product.previewGlbPath}
                  alt={product.title}
                  variant="preview"
                />
              ) : product.coverImagePath ? (
                <ProductShowcaseImage
                  src={product.coverImagePath}
                  alt={product.title}
                  variant="detail"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-studio-muted">
                  Нет превью
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:py-4">
          <div>
            <span className="studio-badge inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide text-studio-accent">
              {typeLabel}
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {product.title}
            </h1>
            <p className="mt-4 text-3xl font-semibold text-studio-accent">
              {formatUahFromDb(product.priceUah)}
            </p>
          </div>
          <p className="text-base leading-relaxed text-studio-muted">{product.description}</p>

          <div className="studio-card rounded-2xl border border-studio-border/80 p-5 text-sm leading-relaxed text-studio-muted">
            {isDigital
              ? "После оплаты на email придёт ссылка на скачивание полного архива."
              : "После оплаты на email придёт подтверждение заказа на печать фигурки."}
          </div>

          <ProductPayButton slug={product.slug} className="!px-8 !py-3" />
        </div>
      </div>
    </div>
  );
}
