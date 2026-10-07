import Link from "next/link";
import type { Product } from "@prisma/client";
import { ModelViewer } from "@/components/ModelViewer";
import { ProductCardViewport } from "@/components/ProductCardViewport";
import { ProductShowcaseImage } from "@/components/ProductShowcaseImage";
import { formatUahFromDb } from "@/lib/format";
import { ProductPayButton } from "@/components/ProductPayButton";

type Props = {
  product: Product;
};

function typeMeta(product: Product) {
  if (product.type === "DIGITAL") {
    return { label: "3D модель", hint: "Крутить превью" };
  }
  return { label: "На заказ", hint: "Смотреть фигурку" };
}

export function ProductCard({ product }: Props) {
  const { label, hint } = typeMeta(product);
  const productHref = `/products/${product.slug}`;

  return (
    <article className="studio-card flex flex-col overflow-hidden rounded-2xl">
      <ProductCardViewport href={productHref} typeLabel={label} previewHint={hint}>
        {product.previewGlbPath ? (
          <ModelViewer
            src={product.previewGlbPath}
            alt={product.title}
            variant="card"
          />
        ) : product.coverImagePath ? (
          <ProductShowcaseImage src={product.coverImagePath} alt={product.title} variant="card" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-studio-muted">
            Превью скоро
          </div>
        )}
      </ProductCardViewport>

      <div className="flex flex-1 flex-col gap-3 border-t border-studio-border/60 p-5">
        <h2 className="font-display text-lg font-semibold leading-snug tracking-tight">
          <Link href={productHref} className="hover:text-studio-accent transition-colors">
            {product.title}
          </Link>
        </h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-studio-muted">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-xl font-semibold text-studio-accent">
            {formatUahFromDb(product.priceUah)}
          </p>
          <ProductPayButton slug={product.slug} />
        </div>
      </div>
    </article>
  );
}
