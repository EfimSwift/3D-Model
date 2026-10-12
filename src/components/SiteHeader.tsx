import Link from "next/link";
import { getSession } from "@/lib/session";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-studio-border/80 bg-[rgba(12,11,18,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-studio-accent to-studio-accent-2 text-sm font-bold text-studio-bg shadow-[0_0_20px_rgba(45,212,191,0.35)]"
            aria-hidden
          >
            3D
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Figurki<span className="text-studio-accent">.studio</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="studio-btn-ghost rounded-full px-3 py-1.5">
            Каталог
          </Link>
          {session?.role === "ADMIN" && (
            <Link href="/admin" className="studio-btn-ghost rounded-full px-3 py-1.5">
              Админ
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
