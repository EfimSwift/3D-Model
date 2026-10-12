import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const emailRaw = typeof body?.email === "string" ? body.email : "";

  if (!productId) {
    return NextResponse.json({ error: "productId обязателен" }, { status: 400 });
  }
  if (!isValidEmail(emailRaw)) {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  const prisma = getPrismaClient();
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
  }

  const pending = await prisma.order.findFirst({
    where: {
      customerEmail: email,
      status: OrderStatus.PENDING,
      items: { some: { productId } },
    },
  });

  if (pending) {
    return NextResponse.json({ orderId: pending.id, status: pending.status });
  }

  const order = await prisma.order.create({
    data: {
      customerEmail: email,
      status: OrderStatus.PENDING,
      items: {
        create: {
          productId: product.id,
          priceUah: product.priceUah,
        },
      },
    },
  });

  return NextResponse.json({ orderId: order.id, status: order.status });
}
