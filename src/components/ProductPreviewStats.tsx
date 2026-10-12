import type { ProductType } from "@prisma/client";
import type { ProductStats } from "@/lib/product-stats";
import { pluralRu } from "@/lib/plural-ru";

type Props = {
  stats: ProductStats;
  productType: ProductType;
  className?: string;
};

export function ProductPreviewStats({ stats, productType, className = "" }: Props) {
  const purchaseLabel = `${stats.purchaseCount} ${pluralRu(
    stats.purchaseCount,
    "покупка",
    "покупки",
    "покупок",
  )}`;

  const showDownloads = productType === "DIGITAL";
  const downloadLabel = `${stats.downloadCount} ${pluralRu(
    stats.downloadCount,
    "скачивание",
    "скачивания",
    "скачиваний",
  )}`;

  return (
    <div
      className={`pointer-events-none flex flex-col items-end gap-1 ${className}`}
      aria-label={
        showDownloads
          ? `${purchaseLabel}, ${downloadLabel}`
          : purchaseLabel
      }
    >
      <span className="studio-badge rounded-full px-2.5 py-1 text-[11px] font-medium text-studio-text/95">
        {purchaseLabel}
      </span>
      {showDownloads && (
        <span className="studio-badge rounded-full px-2.5 py-1 text-[11px] font-medium text-studio-muted">
          {downloadLabel}
        </span>
      )}
    </div>
  );
}
