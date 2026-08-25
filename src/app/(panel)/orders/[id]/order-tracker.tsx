"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { ReceiptModal, orderReceiptRows } from "@/components/receipt";
import { PublicLink } from "@/components/public-link";
import { PageHeader, StatusBadge } from "@/components/status-badge";
import { money } from "@/lib/platforms";
import { publicHref } from "@/lib/public-link";
import type { OrderRecord } from "@/lib/types";

function isOpen(status: string) {
  return !/completed|canceled|cancelled|refunded/i.test(status || "");
}

function isQueued(status: string) {
  return /pending|awaiting|queued/i.test(status || "");
}

function headline(status: string) {
  if (/completed/i.test(status || "")) return "Completed";
  if (/partial/i.test(status || "")) return "Partially delivered";
  if (/canceled|cancelled|refunded/i.test(status || "")) return status;
  if (isQueued(status)) return "Waiting for the provider to start";
  if (/progress|processing/i.test(status || "")) return "Delivery in progress";
  return status || "Waiting";
}

function progressOf(order: OrderRecord) {
  const qty = Number(order.quantity) || 0;
  const raw = String(order.remains ?? "").trim();
  const remains = raw === "" ? Number.NaN : Number(raw);
  const started = Boolean(String(order.startCount ?? "").trim());
  if (!qty) return { delivered: 0, percent: 0, remains: "—" };
  // Empty remains, or remains=0 before the provider has a start count, means
  // "not started" — Number("") is 0, which used to paint a fake 100%.
  if (!Number.isFinite(remains) || (isQueued(order.status) && !started && remains === 0)) {
    return { delivered: 0, percent: 0, remains: qty.toLocaleString() };
  }
  const delivered = Math.max(0, Math.min(qty, qty - remains));
  return {
    delivered,
    percent: Math.round((delivered / qty) * 100),
    remains: remains.toLocaleString(),
  };
}

export function OrderTracker({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [acting, setActing] = useState("");

  async function load() {
    const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Order not found");
      return;
    }
    setOrder(data.order);
    setError("");
  }

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCustomer(d.user?.name || d.user?.email || ""));
  }, [id]);

  useEffect(() => {
    if (!order || !isOpen(order.status)) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [order?.status, id]);

  const progress = useMemo(() => (order ? progressOf(order) : null), [order]);
  const live = order ? isOpen(order.status) : false;

  async function act(kind: "refill" | "cancel") {
    if (!order) return;
    setActing(kind);
    const res = await fetch(`/api/orders/${order.id}/${kind}`, { method: "POST" });
    const data = await res.json();
    setActing("");
    if (!res.ok) setError(data.error || "Could not update the order.");
    else await load();
  }

  if (!order && error) {
    return (
      <div>
        <PageHeader title="Order" description={error} />
        <Link href="/orders" className="ghost-btn px-4 py-2.5">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <span className="order-spinner" aria-hidden />
        <p className="text-sm text-zinc-500">Loading order…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/orders" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft size={16} /> All orders
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={`Order #${order.providerOrderId}`}
          description={
            live
              ? isQueued(order.status)
                ? "The provider has the order. Delivery has not started yet — this page will update when it does."
                : "Live from the provider. This page refreshes as delivery continues."
              : "This order has finished updating."
          }
        />
        <StatusBadge status={order.status} />
      </div>

      <article className="glass-card space-y-5 p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm">
          {live && !isQueued(order.status) ? <span className="live-dot" /> : null}
          <p className="font-medium text-white">{headline(order.status)}</p>
        </div>
        {isQueued(order.status) ? (
          <p className="text-sm text-zinc-500">
            Jeskie still has this in their queue. “Instant start” on the service is only an estimate (0–10 minutes).
            Nothing has been delivered until start count moves above 0.
          </p>
        ) : null}

        <p className="break-words text-sm text-zinc-300">{order.serviceName}</p>

        {progress ? (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-zinc-400">
                {progress.delivered.toLocaleString()} of {Number(order.quantity).toLocaleString()} delivered
              </span>
              <span className="font-medium text-white">{progress.percent}%</span>
            </div>
            <div className="order-progress" aria-hidden>
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {progress.delivered === 0 && isQueued(order.status)
                ? `Still to deliver ${progress.remains}`
                : `Remaining ${progress.remains}`}
              {order.startCount ? ` · Start count ${order.startCount}` : ""}
            </p>
          </div>
        ) : null}

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Charge</dt>
            <dd className="mt-1 font-medium text-white">{money(order.charge, order.currency)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Quantity</dt>
            <dd className="mt-1 font-medium text-white">{Number(order.quantity).toLocaleString()}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Public link</dt>
            <dd className="mt-1">
              {publicHref(order.link) ? (
                <PublicLink link={order.link} label="Open the public URL" />
              ) : (
                <span className="break-all text-zinc-300">{order.link || "—"}</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="gold-btn px-4 py-2.5" onClick={() => setReceiptOpen(true)}>
            <ReceiptText size={16} /> Receipt
          </button>
          <button type="button" className="ghost-btn px-4 py-2.5" disabled={Boolean(acting)} onClick={() => act("refill")}>
            {acting === "refill" ? "Requesting…" : "Refill"}
          </button>
          <button type="button" className="ghost-btn px-4 py-2.5" disabled={Boolean(acting)} onClick={() => act("cancel")}>
            {acting === "cancel" ? "Canceling…" : "Cancel"}
          </button>
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </article>

      {receiptOpen ? (
        <ReceiptModal title="ORDER RECEIPT" rows={orderReceiptRows(order, customer)} onClose={() => setReceiptOpen(false)} />
      ) : null}
    </div>
  );
}
