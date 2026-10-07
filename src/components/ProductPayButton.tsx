import Link from "next/link";

type Props = {
  slug: string;
  className?: string;
};

export function ProductPayButton({ slug, className = "" }: Props) {
  return (
    <Link
      href={`/checkout/${slug}`}
      className={`studio-btn-primary shrink-0 rounded-full px-5 py-2.5 text-sm ${className}`}
    >
      Оплатить
    </Link>
  );
}
