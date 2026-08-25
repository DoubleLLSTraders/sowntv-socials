import { jsonError, requireUser } from "@/lib/auth";
import { refillOrder } from "@/lib/orders";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await refillOrder(user, id);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
