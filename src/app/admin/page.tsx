import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AdminOrderActions } from "@/components/AdminOrderActions";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/staff/login");
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      items: { include: { product: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Админ — заказы</h1>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="studio-btn-ghost rounded-full px-3 py-1.5 text-sm">
            Выйти
          </button>
        </form>
      </div>
      <ul className="mt-8 space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="studio-card rounded-2xl p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-studio-muted">{order.customerEmail}</span>
              <span className="text-sm font-medium">{order.status}</span>
            </div>
            <ul className="mt-2 text-sm">
              {order.items.map((i) => (
                <li key={i.id}>{i.product.title}</li>
              ))}
            </ul>
            {order.status === "PENDING" && (
              <AdminOrderActions orderId={order.id} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
