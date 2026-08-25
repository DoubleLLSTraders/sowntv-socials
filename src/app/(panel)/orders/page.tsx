"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, PageHeader } from "@/components/status-badge";
import { ReceiptModal, orderReceiptRows } from "@/components/receipt";
import { PublicLink } from "@/components/public-link";
import { syncFirebaseAccount } from "@/lib/firebase-store";
import { money } from "@/lib/platforms";
import type { OrderRecord } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState("");
  const [receipt, setReceipt] = useState<OrderRecord | null>(null);

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    const orders = data.orders || [];
    setOrders(orders);
    if (orders.length) syncFirebaseAccount({ orders });
  }

  useEffect(() => {
    load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCustomer(d.user?.name || d.user?.email || ""));
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  async function act(id: string, kind: "refill" | "cancel") {
    setMessage("");
    const res = await fetch(`/api/orders/${id}/${kind}`, { method: "POST" });
    const data = await res.json();
    setMessage(data.error || (kind === "refill" ? `Refill #${data.refill}` : "Cancel requested"));
    load();
  }

  return (
    <div>
      <PageHeader title="Orders" description="Status updates automatically every 20 seconds." />
      {message && <p className="mb-4 text-sm text-slate-600">{message}</p>}
      <div className="panel-card overflow-hidden">
        {orders.length ? (
          <>
            <div className="divide-y divide-white/10 md:hidden">
              {orders.map((order) => (
                <article key={order.id} className="px-4 py-4">
                  <p className="text-xs text-zinc-500">#{order.providerOrderId}</p>
                  <Link href={`/orders/${order.id}`} className="mt-1 block break-words font-medium hover:text-red-400">
                    {order.serviceName}
                  </Link>
                  <div className="mt-1 text-xs">
                    <PublicLink link={order.link} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-zinc-400">
                      {order.quantity} · {money(order.charge, order.currency)}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/orders/${order.id}`} className="gold-btn px-2.5 py-1.5 text-xs">
                      Track
                    </Link>
                    <button
                      type="button"
                      onClick={() => setReceipt(order)}
                      className="ghost-btn px-2.5 py-1.5 text-xs"
                    >
                      Receipt
                    </button>
                    <button onClick={() => act(order.id, "refill")} className="ghost-btn px-2.5 py-1.5 text-xs">
                      Refill
                    </button>
                    <button onClick={() => act(order.id, "cancel")} className="ghost-btn px-2.5 py-1.5 text-xs">
                      Cancel
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="table-wrap hidden md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>Link</th>
                    <th>Qty</th>
                    <th>Charge</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="text-slate-500">
                        <Link href={`/orders/${order.id}`} className="hover:text-red-400">
                          #{order.providerOrderId}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/orders/${order.id}`} className="font-medium hover:text-red-400">
                          {order.serviceName}
                        </Link>
                        <p className="text-xs text-slate-500">{order.category}</p>
                      </td>
                      <td className="max-w-[220px]">
                        <PublicLink link={order.link} className="text-sm" />
                      </td>
                      <td>{order.quantity}</td>
                      <td>{money(order.charge, order.currency)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/orders/${order.id}`} className="gold-btn px-2.5 py-1 text-xs">
                            Track
                          </Link>
                          <button
                            type="button"
                            onClick={() => setReceipt(order)}
                            className="ghost-btn px-2.5 py-1 text-xs"
                          >
                            Receipt
                          </button>
                          <button onClick={() => act(order.id, "refill")} className="ghost-btn px-2.5 py-1 text-xs">
                            Refill
                          </button>
                          <button onClick={() => act(order.id, "cancel")} className="ghost-btn px-2.5 py-1 text-xs">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-500">No orders yet.</p>
        )}
      </div>
      {receipt && (
        <ReceiptModal
          title="ORDER RECEIPT"
          rows={orderReceiptRows(receipt, customer)}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
