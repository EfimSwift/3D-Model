import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Лёгкий лимит на все /api/* (дополнение к Redis/Caddy/Cloudflare).
 * Тяжёлая логика — в route handlers.
 */
const WINDOW_MS = 60_000;
const MAX_PER_IP = 120;
const hits = new Map<string, { n: number; reset: number }>();

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const now = Date.now();
  const key = `mw:${ip}`;
  let bucket = hits.get(key);
  if (!bucket || now >= bucket.reset) {
    bucket = { n: 0, reset: now + WINDOW_MS };
    hits.set(key, bucket);
  }
  bucket.n += 1;

  if (bucket.n > MAX_PER_IP) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
