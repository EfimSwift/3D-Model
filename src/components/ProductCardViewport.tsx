import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  typeLabel: string;
  previewHint?: string;
};

export function ProductCardViewport({
  href,
  children,
  typeLabel,
  previewHint = "Открыть",
}: Props) {
  return (
    <Link href={href} className="group/viewport relative block aspect-square studio-viewport">
      <div className="studio-viewport-shine" aria-hidden />
      <div className="relative z-[1] h-full w-full">{children}</div>
      <span
        className="studio-badge absolute left-3 top-3 z-[2] rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-studio-accent"
      >
        {typeLabel}
      </span>
      <span
        className="studio-badge absolute bottom-3 left-3 z-[2] rounded-full px-2.5 py-1 text-xs text-studio-muted opacity-0 transition group-hover/viewport:opacity-100"
      >
        {previewHint}
      </span>
    </Link>
  );
}
