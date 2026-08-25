import { NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/auth";
import { readOnly } from "@/lib/db";
import { placeCustomerOrder, syncOrders } from "@/lib/orders";
import { publicOrder } from "@/lib/public";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const mine = url.searchParams.get("all") !== "1" || user.role !== "admin";
    await syncOrders();
    const orders = await readOnly((store) =>
      mine ? store.orders.filter((o) => o.userId === user.id) : store.orders,
    );
    return Response.json({ orders: orders.map((order) => publicOrder(order, user.role)) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as Parameters<typeof placeCustomerOrder>[1];
    const order = await placeCustomerOrder(user, body);
    return Response.json({ order: publicOrder(order, user.role) });
  } catch (error) {
    return jsonError(error);
  }
}
