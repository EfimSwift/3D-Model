import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/mark-paid";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ orderId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  const result = await markOrderPaid(orderId, {
    paymentProvider: "admin_manual",
    paymentExternalId: `admin_${orderId}_${Date.now()}`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
