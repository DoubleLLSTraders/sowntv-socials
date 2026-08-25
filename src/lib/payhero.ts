import { randomBytes } from "crypto";

export { normalizeMpesaReceipt } from "./mpesa";

const BASE = "https://backend.payhero.co.ke/api/v2";

export class PayheroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayheroError";
  }
}

function authHeaders() {
  const headers: string[] = [];
  const user = process.env.PAYHERO_API_USERNAME?.trim();
  const pass = process.env.PAYHERO_API_PASSWORD?.trim();
  if (user && pass) headers.push(`Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`);
  const basic = process.env.PAYHERO_BASIC_AUTH?.trim();
  if (basic) {
    const value = basic.startsWith("Basic ") ? basic : `Basic ${basic}`;
    if (!headers.includes(value)) headers.push(value);
  }
  if (!headers.length) {
    throw new PayheroError("PayHero is not configured. Add API credentials to .env.local.");
  }
  return headers;
}

async function payheroOnce<T>(path: string, auth: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new PayheroError("PayHero returned an invalid response.");
  }
  if (!res.ok) {
    const err = data as { error_message?: string; message?: string; error?: string };
    const detail = err.error_message || err.message || err.error || `PayHero error (${res.status}).`;
    const failure = new PayheroError(detail);
    (failure as PayheroError & { status?: number }).status = res.status;
    throw failure;
  }
  return data as T;
}

async function payhero<T>(path: string, init?: RequestInit): Promise<T> {
  const candidates = authHeaders();
  let last: unknown;
  for (const auth of candidates) {
    try {
      return await payheroOnce<T>(path, auth, init);
    } catch (error) {
      last = error;
      const status = (error as PayheroError & { status?: number }).status;
      if (status !== 401 && status !== 403) break;
    }
  }
  if (process.env.NODE_ENV !== "production") {
    const status = (last as PayheroError & { status?: number })?.status;
    console.log("[payhero] request failed", JSON.stringify({ path, status: status ?? null, message: (last as Error)?.message }));
  }
  throw last instanceof Error ? last : new PayheroError("PayHero request failed.");
}

let cachedChannelId: number | null = null;

export async function getPayheroChannelId() {
  const fromEnv = Number(process.env.PAYHERO_CHANNEL_ID);
  if (fromEnv) return fromEnv;
  if (cachedChannelId) return cachedChannelId;
  const data = await payhero<{ payment_channels?: Array<{ id: number; is_active?: boolean }> }>(
    "/payment_channels?is_active=true",
  );
  const channel = data.payment_channels?.find((item) => item.is_active !== false) || data.payment_channels?.[0];
  if (!channel?.id) {
    throw new PayheroError("No PayHero payment channel found. Add one under Payment Channels in the PayHero portal.");
  }
  cachedChannelId = channel.id;
  return channel.id;
}

export function normalizeKenyaPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `254${digits}`;
  return "";
}

export type StkResult = {
  success?: boolean;
  status?: string;
  reference?: string;
  CheckoutRequestID?: string;
};

export async function initiateStkPush(input: {
  amount: number;
  phone: string;
  reference: string;
  name?: string;
  callbackUrl?: string;
}) {
  const channelId = await getPayheroChannelId();
  const body: Record<string, string | number> = {
    amount: Math.round(input.amount),
    phone_number: input.phone,
    channel_id: channelId,
    provider: "m-pesa",
    external_reference: input.reference,
    customer_name: input.name || "SownTV customer",
  };
  if (input.callbackUrl?.startsWith("https://")) body.callback_url = input.callbackUrl;
  return payhero<StkResult>("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type PayheroStatus = {
  status?: string;
  success?: boolean;
  reference?: string;
  provider_reference?: string;
  third_party_reference?: string;
  payment_reference?: string;
  CheckoutRequestID?: string;
};

export type PayheroTxn = {
  id?: number;
  amount?: number;
  description?: string;
  transaction_reference?: string;
  provider_reference?: string;
  transaction_type?: string;
  transaction_name?: string;
  created_at?: string;
  phone?: string;
  customer_phone?: string;
  external_reference?: string;
  reference?: string;
};

export async function getPayheroStatus(reference: string) {
  return payhero<PayheroStatus>(`/transaction-status?reference=${encodeURIComponent(reference)}`);
}

export async function lookupPayheroStatus(reference: string): Promise<PayheroStatus | null> {
  const value = reference.trim();
  if (!value) return null;
  try {
    return await getPayheroStatus(value);
  } catch {
    return null;
  }
}

export function lipwaExternalRef() {
  return `swn${randomBytes(4).toString("hex")}`;
}

function extractTransactionList(data: unknown, depth = 0): PayheroTxn[] {
  if (depth > 5 || data == null) return [];
  if (Array.isArray(data)) {
    const rows = data.filter(
      (item): item is PayheroTxn =>
        Boolean(item) && typeof item === "object" && ("amount" in item || "transaction_reference" in item || "provider_reference" in item),
    );
    if (rows.length) return rows;
    return data.flatMap((item) => extractTransactionList(item, depth + 1));
  }
  if (typeof data === "object") {
    return Object.values(data as Record<string, unknown>).flatMap((value) => extractTransactionList(value, depth + 1));
  }
  return [];
}

export async function getPayheroTransactions(page = 1, per = 40) {
  return payhero<unknown>(`/transactions?page=${page}&per=${per}`);
}

export async function listPayheroTransactions(): Promise<{ transactions: PayheroTxn[]; error?: string }> {
  const rows: PayheroTxn[] = [];
  for (const page of [1, 2, 3]) {
    try {
      const chunk = extractTransactionList(await getPayheroTransactions(page, 50));
      rows.push(...chunk);
      if (chunk.length < 50) break;
    } catch (error) {
      return { transactions: rows, error: error instanceof Error ? error.message : "PayHero request failed." };
    }
  }
  return { transactions: rows };
}

export function receiptFromStatus(remote: PayheroStatus | null | undefined) {
  if (!remote) return "";
  return remote.provider_reference || remote.third_party_reference || remote.payment_reference || "";
}

export function transactionReceipt(txn: PayheroTxn) {
  const ref = txn.transaction_reference || "";
  if (!ref || ref.toLowerCase().startsWith("cost_")) return txn.provider_reference || "";
  return ref;
}

export function transactionMatchesDeposit(
  txn: PayheroTxn,
  deposit: { id: string; amount: number; phone?: string; createdAt: string; externalRef?: string },
) {
  const blob = JSON.stringify(txn).toLowerCase();
  if (blob.includes(deposit.id.toLowerCase())) return true;
  if (deposit.externalRef && blob.includes(deposit.externalRef.toLowerCase())) return true;
  if (blob.includes(deposit.id.replace(/-/g, "").slice(0, 12).toLowerCase())) return true;
  const received = /received\s+kes\s+(\d+)/i.exec(`${txn.description || ""} ${txn.transaction_name || ""}`);
  const receivedAmount = received ? Number(received[1]) : NaN;
  const rawAmount = Math.abs(Number(txn.amount));
  const amountOk =
    Math.round(rawAmount) === Math.round(deposit.amount) || receivedAmount === Math.round(deposit.amount);
  if (!amountOk) return false;
  const phone = (deposit.phone || "").replace(/\D/g, "");
  const phoneTail = phone.slice(-9);
  if (phoneTail && blob.includes(phoneTail)) return true;
  const txnAt = txn.created_at ? Date.parse(txn.created_at) : 0;
  const depositAt = Date.parse(deposit.createdAt);
  if (!txnAt || !depositAt) return true;
  return txnAt + 120_000 >= depositAt && txnAt - depositAt < 2 * 60 * 60 * 1000;
}

export function isPublicHttpsOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) return false;
    if (/^(10|127|169\.254)\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function lipwaReturnUrls(origin: string, depositId: string) {
  const success = process.env.PAYHERO_SUCCESS_URL?.trim();
  const failed = process.env.PAYHERO_FAILED_URL?.trim();
  const publicOrigin = isPublicHttpsOrigin(origin);
  return {
    successUrl: success || (publicOrigin ? `${origin.replace(/\/$/, "")}/pay/done/${depositId}` : undefined),
    failedUrl: failed || (publicOrigin ? `${origin.replace(/\/$/, "")}/pay/failed/${depositId}` : undefined),
  };
}

export function lipwaCheckoutUrl(input: {
  amount: number;
  phone?: string;
  name?: string;
  reference: string;
  successUrl?: string;
  failedUrl?: string;
}) {
  const account = process.env.PAYHERO_ACCOUNT_ID?.trim();
  const base =
    process.env.PAYHERO_LIPWA_URL?.trim() ||
    (account ? `https://app.payhero.co.ke/lipwa/${account}` : "");
  if (!base) {
    throw new PayheroError("PayHero Lipwa checkout is not configured.");
  }
  const url = new URL(base);
  url.searchParams.set("amount", String(Math.round(input.amount)));
  url.searchParams.set("reference", input.reference);
  if (input.successUrl) url.searchParams.set("success_url", input.successUrl);
  if (input.failedUrl) url.searchParams.set("failed_url", input.failedUrl);
  if (input.phone) url.searchParams.set("phone", input.phone);
  if (input.name) url.searchParams.set("name", input.name.replace(/\s+/g, ""));
  const channel = Number(process.env.PAYHERO_CHANNEL_ID);
  if (channel) url.searchParams.set("channel_id", String(channel));
  return url.toString();
}

export function isPayheroSuccess(status?: string, success?: boolean) {
  const value = (status || "").toLowerCase();
  return (
    success === true ||
    value === "success" ||
    value === "successful" ||
    value === "completed" ||
    value === "paid" ||
    value === "complete"
  );
}

export function isPayheroFailed(status?: string) {
  const value = (status || "").toLowerCase();
  return value === "failed" || value === "fail" || value === "cancelled" || value === "canceled";
}
