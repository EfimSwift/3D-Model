import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });

  const digital = products.filter((p) => p.type === "DIGITAL");
  const physical = products.filter((p) => p.type === "PHYSICAL");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <section className="relative mb-14 overflow-hidden rounded-3xl border border-studio-border studio-card px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-studio-accent">
          Мастерская 3D
        </p>
        <h1 className="font-display mt-3 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Модели для скачивания и&nbsp;фигурки на&nbsp;заказ
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-studio-muted">
          Без регистрации: укажите email при оплате — чек и ссылка на покупку придут на почту.
        </p>
      </section>

      {digital.length > 0 && (
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold">Цифровые 3D модели</h2>
            <p className="mt-1 text-sm text-studio-muted">Превью бесплатно · архив после оплаты</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {digital.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {physical.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold">Фигурки на заказ</h2>
            <p className="mt-1 text-sm text-studio-muted">
              Оплата и статус заказа — на ваш email
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {physical.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
