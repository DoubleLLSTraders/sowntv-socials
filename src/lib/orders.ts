import { randomUUID } from "crypto";
import { withStore } from "./db";
import {
  addOrder,
  cancelOrders,
  friendlyProviderError,
  getBulkStatus,
  getStatus,
  isServiceGoneError,
  JeskieError,
  requestRefill,
} from "./jeskie";
import { orderCost, rateForUser } from "./pricing";
import { disableService, getCatalog } from "./catalog";
import { providerLink } from "./order-link";
import type { OrderRecord, RetailService, User, JeskieOrderStatus } from "./types";

function findService(services: RetailService[], id: number) {
  return services.find((s) => Number(s.service) === Number(id));
}

export async function placeCustomerOrder(user: User, input: {
  service: number;
  link?: string;
  quantity?: number;
  comments?: string;
  runs?: number;
  interval?: number;
  username?: string;
  min?: number;
  max?: number;
  posts?: number;
  old_posts?: number;
  delay?: number;
  expiry?: string;
}) {
  const catalog = await getCatalog();
  const service = findService(catalog.services, input.service);
  if (!service) {
    const err = new Error("That service is no longer available from the provider. Pick another one from the list.");
    (err as Error & { status: number; code: string }).status = 400;
    (err as Error & { status: number; code: string }).code = "service_gone";
    throw err;
  }

  const type = service.type || "Default";
  let quantity = Number(input.quantity || 0);
  if (/custom comments/i.test(type)) {
    const lines = (input.comments || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) {
      const err = new Error("Add at least one comment, one per line.");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
    quantity = lines.length;
    input.comments = lines.join("\n");
  } else if (/package/i.test(type)) {
    quantity = 1;
  } else if (/subscription/i.test(type)) {
    quantity = Number(input.max || input.min || 0);
    if (!input.username) {
      const err = new Error("Username is required for subscription services.");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
  } else {
    if (!input.link) {
      const err = new Error("A public link is required.");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
    const min = Number(service.min) || 0;
    const max = Number(service.max) || 0;
    if (!quantity || quantity < min || (max && quantity > max)) {
      const err = new Error(`Quantity must be between ${min} and ${max}.`);
      (err as Error & { status: number }).status = 400;
      throw err;
    }
  }

  const charge = orderCost({
    type,
    ratePerThousand: rateForUser(user.role, service),
    quantity,
    runs: input.runs,
  });
  const cost = orderCost({
    type,
    ratePerThousand: service.wholesaleRate || 0,
    quantity,
    runs: input.runs,
  });

  await withStore((store) => {
    const u = store.users.find((row) => row.id === user.id);
    if (!u || u.balance + 1e-8 < charge) {
      const err = new Error("Not enough wallet balance. Add funds first.");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
    u.balance = Number((u.balance - charge).toFixed(4));
  });

  const linkForProvider = providerLink(service, input.link);

  let providerOrderId: string;
  try {
    const result = await addOrder({
      service: input.service,
      link: linkForProvider,
      quantity: /package|subscription/i.test(type) ? undefined : quantity,
      comments: input.comments,
      runs: input.runs,
      interval: input.interval,
      username: input.username,
      min: input.min,
      max: input.max,
      posts: input.posts,
      old_posts: input.old_posts,
      delay: input.delay,
      expiry: input.expiry,
    });
    providerOrderId = String(result.order);
  } catch (error) {
    await withStore((store) => {
      const u = store.users.find((row) => row.id === user.id);
      if (u) u.balance = Number((u.balance + charge).toFixed(4));
    });
    const raw = error instanceof JeskieError ? error.message : "";
    const gone = Boolean(raw) && isServiceGoneError(raw);
    if (gone) await disableService(Number(input.service), raw);
    const message = raw ? friendlyProviderError(raw) : "Could not place the order.";
    const err = new Error(message);
    (err as Error & { status: number; code?: string }).status = 400;
    if (gone) (err as Error & { status: number; code?: string }).code = "service_gone";
    throw err;
  }

  const order: OrderRecord = {
    id: randomUUID(),
    userId: user.id,
    providerOrderId,
    serviceId: Number(service.service),
    serviceName: service.name,
    category: service.category,
    type,
    link: input.link || input.username || "",
    quantity,
    charge,
    cost,
    currency: catalog.currency,
    status: "Pending",
    startCount: "",
    remains: "",
    refillId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await withStore((store) => {
    store.orders.unshift(order);
  });

  return order;
}

function pickStatus(bulk: Record<string, JeskieOrderStatus> | JeskieOrderStatus, id: string) {
  if (!bulk || typeof bulk !== "object") return null;
  const rec = bulk as Record<string, unknown>;
  const direct = rec[id] ?? rec[String(Number(id))];
  if (direct && typeof direct === "object") return direct as JeskieOrderStatus;
  if ("status" in rec || "remains" in rec || "start_count" in rec) return bulk as JeskieOrderStatus;
  return null;
}

export async function syncOrders(orderIds?: string[]) {
  const targets = await withStore((store) => {
    const list = orderIds
      ? store.orders.filter((o) => orderIds.includes(o.id) || orderIds.includes(o.providerOrderId))
      : store.orders.filter((o) => !/completed|canceled|cancelled|refunded|partial/i.test(o.status)).slice(0, 100);
    return list;
  });

  if (!targets.length) return [];

  try {
    const ids = targets.map((o) => o.providerOrderId);
    const bulk =
      ids.length === 1 ? await getStatus(ids[0]) : await getBulkStatus(ids);
    await withStore((store) => {
      for (const local of targets) {
        const remote = pickStatus(bulk as Record<string, JeskieOrderStatus>, local.providerOrderId);
        const row = store.orders.find((o) => o.id === local.id);
        if (!row || !remote || remote.error) continue;
        row.status = remote.status || row.status;
        if (remote.start_count !== undefined && remote.start_count !== "") {
          row.startCount = String(remote.start_count);
        }
        if (remote.remains !== undefined && remote.remains !== "") {
          row.remains = String(remote.remains);
        }
        row.updatedAt = new Date().toISOString();
      }
    });
  } catch {
    // Keep local statuses if provider polling fails.
  }

  return withStore((store) =>
    store.orders.filter((o) => targets.some((t) => t.id === o.id)),
  );
}

export async function refillOrder(user: User, orderId: string) {
  const order = await withStore((store) => {
    const row = store.orders.find((o) => o.id === orderId);
    if (!row) return null;
    if (user.role !== "admin" && row.userId !== user.id) return "forbidden" as const;
    return row;
  });
  if (!order || order === "forbidden") {
    const err = new Error(order === "forbidden" ? "Forbidden" : "Order not found");
    (err as Error & { status: number }).status = order === "forbidden" ? 403 : 404;
    throw err;
  }

  try {
    const result = await requestRefill(order.providerOrderId);
    await withStore((store) => {
      const row = store.orders.find((o) => o.id === orderId);
      if (row) row.refillId = String(result.refill);
    });
    return { refill: result.refill };
  } catch (error) {
    const message = error instanceof JeskieError ? friendlyProviderError(error.message) : "Refill failed.";
    const err = new Error(message);
    (err as Error & { status: number }).status = 400;
    throw err;
  }
}

export async function cancelOrder(user: User, orderId: string) {
  const order = await withStore((store) => store.orders.find((o) => o.id === orderId) || null);
  if (!order || (user.role !== "admin" && order.userId !== user.id)) {
    const err = new Error("Order not found");
    (err as Error & { status: number }).status = 404;
    throw err;
  }
  try {
    await cancelOrders([order.providerOrderId]);
    await withStore((store) => {
      const row = store.orders.find((o) => o.id === orderId);
      if (row) {
        row.status = "Canceled";
        row.updatedAt = new Date().toISOString();
      }
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof JeskieError ? friendlyProviderError(error.message) : "Cancel failed.";
    const err = new Error(message);
    (err as Error & { status: number }).status = 400;
    throw err;
  }
}

