import { NextRequest } from "next/server";
import { readOnly } from "@/lib/db";
import { getCatalog } from "@/lib/catalog";
import { getStatus } from "@/lib/jeskie";
import { placeCustomerOrder } from "@/lib/orders";
import { safeEqual } from "@/lib/session";

async function userByKey(key: string) {
  if (key.length !== 32) return null;
  return readOnly((store) => {
    let found = null;
    for (const user of store.users) {
      if (user.apiKey.length === 32 && safeEqual(user.apiKey, key)) found = user;
    }
    return found;
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(async () => {
    const json = (await req.json().catch(() => ({}))) as Record<string, string>;
    const fd = new FormData();
    for (const [k, v] of Object.entries(json)) fd.set(k, String(v));
    return fd;
  });

  const key = String(form.get("key") || "");
  const action = String(form.get("action") || "");
  if (!key || !action) {
    return Response.json({ error: "Incorrect request." });
  }

  const user = await userByKey(key);
  if (!user || user.role !== "admin") return Response.json({ error: "Invalid API Key." });

  try {
    if (action === "balance") {
      return Response.json({
        balance: user.balance.toFixed(5),
        currency: process.env.NEXT_PUBLIC_CURRENCY || "KES",
      });
    }

    if (action === "services") {
      const catalog = await getCatalog();
      return Response.json(
        catalog.services.map((s) => ({
          service: s.service,
          name: s.name,
          type: s.type,
          category: s.category,
          rate: (user.role === "admin" ? s.wholesaleRate || s.retailRate : s.retailRate).toFixed(4),
          min: s.min,
          max: s.max,
          refill: s.refill,
          cancel: s.cancel,
        })),
      );
    }

    if (action === "add") {
      const order = await placeCustomerOrder(user, {
        service: Number(form.get("service")),
        link: String(form.get("link") || ""),
        quantity: form.get("quantity") ? Number(form.get("quantity")) : undefined,
        comments: String(form.get("comments") || "") || undefined,
        runs: form.get("runs") ? Number(form.get("runs")) : undefined,
        interval: form.get("interval") ? Number(form.get("interval")) : undefined,
        username: String(form.get("username") || "") || undefined,
        min: form.get("min") ? Number(form.get("min")) : undefined,
        max: form.get("max") ? Number(form.get("max")) : undefined,
        posts: form.get("posts") ? Number(form.get("posts")) : undefined,
        old_posts: form.get("old_posts") ? Number(form.get("old_posts")) : undefined,
        delay: form.get("delay") ? Number(form.get("delay")) : undefined,
        expiry: String(form.get("expiry") || "") || undefined,
      });
      return Response.json({ order: order.providerOrderId });
    }

    if (action === "status") {
      const providerId = String(form.get("order") || "");
      const owned = await readOnly((store) =>
        store.orders.find((o) => o.userId === user.id && o.providerOrderId === providerId),
      );
      if (!owned) return Response.json({ error: "Incorrect order ID" });
      const status = await getStatus(providerId);
      return Response.json(status);
    }

    return Response.json({ error: "Incorrect request." });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Request failed" });
  }
}
