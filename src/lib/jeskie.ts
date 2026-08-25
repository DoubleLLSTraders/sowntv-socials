import type {
  JeskieBalance,
  JeskieOrderStatus,
  JeskieService,
} from "./types";

const DEFAULT_URL = "https://jeskieinc.com/api/v2";

export class JeskieError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JeskieError";
  }
}

type Params = Record<string, string | number | undefined | null>;

async function jeskie<T>(params: Params): Promise<T> {
  const key = process.env.JESKIE_API_KEY;
  if (!key) {
    throw new JeskieError("Jeskie API key is not configured on the server.");
  }

  const body = new URLSearchParams();
  body.set("key", key);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    body.set(name, String(value));
  }

  const res = await fetch(process.env.JESKIE_API_URL || DEFAULT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new JeskieError("Provider returned an invalid response.");
  }

  if (data && typeof data === "object" && "error" in data && (data as { error: string }).error) {
    throw new JeskieError(String((data as { error: string }).error));
  }

  return data as T;
}

export function listServices() {
  return jeskie<JeskieService[]>({ action: "services" });
}

export function getBalance() {
  return jeskie<JeskieBalance>({ action: "balance" });
}

export function addOrder(input: {
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
  return jeskie<{ order: number }>({ action: "add", ...input });
}

export function getStatus(orderId: string | number) {
  return jeskie<JeskieOrderStatus>({ action: "status", order: orderId });
}

export function getBulkStatus(orderIds: Array<string | number>) {
  return jeskie<Record<string, JeskieOrderStatus>>({
    action: "status",
    orders: orderIds.join(","),
  });
}

export function requestRefill(orderId: string | number) {
  return jeskie<{ refill: number | string }>({ action: "refill", order: orderId });
}

export function getRefillStatus(refillId: string | number) {
  return jeskie<{ status: string }>({ action: "refill_status", refill: refillId });
}

export function cancelOrders(orderIds: Array<string | number>) {
  return jeskie<unknown>({ action: "cancel", orders: orderIds.join(",") });
}

export function isServiceGoneError(message: string) {
  const lower = message.toLowerCase();
  return (
    /(package|service)[^.]*not\s*(found|available)/.test(lower) ||
    /service[^.]*(disabled|deactivated|inactive|removed)/.test(lower)
  );
}

export function friendlyProviderError(message: string) {
  const lower = message.toLowerCase();
  if (isServiceGoneError(message)) {
    return "The provider has retired this service. It is now removed from the catalogue — pick another service and try again.";
  }
  if (lower.includes("sufficient balance")) {
    return "This service is temporarily unavailable. Try again in a few minutes.";
  }
  if (lower.includes("invalid api key")) {
    return "Ordering is temporarily unavailable. Try again in a few minutes.";
  }
  if (lower.includes("already in progress")) {
    return "An order is already running for this link. Wait until it finishes.";
  }
  return "The provider rejected this order. Check the link and quantity, then try again.";
}
