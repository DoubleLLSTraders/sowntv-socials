import { NextRequest } from "next/server";
import { jsonError, requireUser } from "@/lib/auth";
import { placeCustomerOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as { lines?: string };
    const lines = (body.lines || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    if (!lines.length) {
      return Response.json({ error: "Paste at least one line: service|link|quantity" }, { status: 400 });
    }
    if (lines.length > 50) {
      return Response.json({ error: "Mass order is limited to 50 lines per batch." }, { status: 400 });
    }

    const results: Array<{ line: string; ok: boolean; orderId?: string; error?: string }> = [];
    for (const line of lines) {
      const parts = line.split("|").map((p) => p.trim());
      const service = Number(parts[0]);
      const link = parts[1];
      const quantity = Number(parts[2]);
      try {
        const order = await placeCustomerOrder(user, { service, link, quantity });
        results.push({ line, ok: true, orderId: order.id });
      } catch (error) {
        results.push({
          line,
          ok: false,
          error: error instanceof Error ? error.message : "Failed",
        });
      }
    }

    return Response.json({ results });
  } catch (error) {
    return jsonError(error);
  }
}
