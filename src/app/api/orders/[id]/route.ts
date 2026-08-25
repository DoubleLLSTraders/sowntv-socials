import { jsonError, requireUser } from "@/lib/auth";
import { readOnly } from "@/lib/db";
import { syncOrders } from "@/lib/orders";
import { publicOrder } from "@/lib/public";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await syncOrders([id]);
    const order = await readOnly((store) => {
      const row = store.orders.find((o) => o.id === id || o.providerOrderId === id);
      if (!row) return null;
      if (user.role !== "admin" && row.userId !== user.id) return null;
      return row;
    });
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json({ order: publicOrder(order, user.role) });
  } catch (error) {
    return jsonError(error);
  }
}
