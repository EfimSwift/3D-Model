import path from "path";
import { NextResponse } from "next/server";
import { canDownloadDigitalForOrder } from "@/lib/access";
import { readPrivateModelFile } from "@/lib/crypto/model-files";
import { prisma } from "@/lib/db";
import { verifyDownloadToken } from "@/lib/download-token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Токен отсутствует" }, { status: 400 });
  }

  const payload = await verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Ссылка истекла или недействительна" }, { status: 403 });
  }

  const grant = await prisma.downloadGrant.findUnique({
    where: { id: payload.grantId },
  });

  if (
    !grant ||
    grant.orderId !== payload.orderId ||
    grant.productId !== payload.productId
  ) {
    return NextResponse.json({ error: "Недействительная выдача" }, { status: 403 });
  }

  if (grant.usedAt) {
    return NextResponse.json({ error: "Ссылка уже использована" }, { status: 403 });
  }

  if (grant.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Ссылка истекла" }, { status: 403 });
  }

  const order = await prisma.order.findUnique({ where: { id: payload.orderId } });
  if (!order) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const allowed = await canDownloadDigitalForOrder(
    payload.orderId,
    order.customerEmail,
    payload.productId,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
  });
  if (!product?.privateFilePath) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const marked = await prisma.downloadGrant.updateMany({
    where: { id: grant.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (marked.count === 0) {
    return NextResponse.json({ error: "Ссылка уже использована" }, { status: 403 });
  }

  let buffer: Buffer;
  try {
    buffer = readPrivateModelFile(product.privateFilePath);
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const filename = path.basename(product.privateFilePath.replace(/\.enc$/i, ""));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
