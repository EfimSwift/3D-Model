import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canDownloadDigitalForOrder } from "@/lib/access";
import { getPrismaClient } from "@/lib/db";
import { downloadGrantExpiresAt, signDownloadToken } from "@/lib/download-token";
import { verifyOrderAccessToken } from "@/lib/order-access-token";
import { checkRateLimit, clientIpFromRequest } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = await checkRateLimit(`download-req:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 60) } },
    );
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const access = url.searchParams.get("access");

  if (!productId || !access) {
    return NextResponse.json({ error: "Нужны productId и access" }, { status: 400 });
  }

  const accessPayload = await verifyOrderAccessToken(access);
  if (!accessPayload) {
    return NextResponse.json({ error: "Ссылка недействительна" }, { status: 403 });
  }

  const allowed = await canDownloadDigitalForOrder(
    accessPayload.orderId,
    accessPayload.email,
    productId,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Сначала оплатите товар" }, { status: 403 });
  }

  const grantId = randomUUID();
  const expiresAt = downloadGrantExpiresAt();

  const prisma = getPrismaClient();
  await prisma.downloadGrant.create({
    data: {
      id: grantId,
      orderId: accessPayload.orderId,
      productId,
      expiresAt,
    },
  });

  const token = await signDownloadToken({
    orderId: accessPayload.orderId,
    productId,
    grantId,
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  return NextResponse.json({
    url: `${base}/api/download/file?token=${encodeURIComponent(token)}`,
  });
}
