"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { money, moneyRate } from "@/lib/platforms";
import { youPay } from "@/lib/rate";
import { PageHeader, StatusBadge } from "@/components/status-badge";
import { PlatformChips, PlatformLogo } from "@/components/platform-logo";
import type { Deposit, OrderRecord, PlatformId, RetailService, Ticket } from "@/lib/types";

type Tab = "overview" | "users" | "orders" | "transactions" | "services" | "audit" | "api" | "settings";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "orders", label: "Orders" },
  { id: "transactions", label: "Transactions" },
  { id: "services", label: "Services" },
  { id: "audit", label: "Audit" },
  { id: "api", label: "API" },
  { id: "settings", label: "Settings" },
];

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  firebaseUid?: string;
  createdAt: string;
  orderCount: number;
  spent: number;
  depositTotal: number;
  apiKey?: string;
};

type AdminPayload = {
  me: AdminUser;
  provider: { balance: string; currency: string };
  stats: {
    users: number;
    orders: number;
    pendingDeposits: number;
    openTickets: number;
    revenue: number;
    walletTotal: number;
    deposited: number;
    spent: number;
    cost: number;
    serviceCount: number;
  };
  orderStatus: Record<string, number>;
  users: AdminUser[];
  deposits: Deposit[];
  orders: OrderRecord[];
  tickets: Ticket[];
  settings: { markup: number; depositNumber: string; depositInstructions: string };
};

function userName(users: AdminUser[], id: string) {
  const row = users.find((user) => user.id === id);
  return row ? `${row.name} · ${row.email}` : id;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading admin...</p>}>
      <AdminClient />
    </Suspense>
  );
}

function AdminClient() {
  const params = useSearchParams();
  const requested = (params.get("tab") || "overview") as Tab;
  const [tab, setTab] = useState<Tab>(TABS.some((item) => item.id === requested) ? requested : "overview");
  const [data, setData] = useState<AdminPayload | null>(null);
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [orderQ, setOrderQ] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [txQ, setTxQ] = useState("");
  const [services, setServices] = useState<RetailService[]>([]);
  const [serviceQ, setServiceQ] = useState("");
  const [servicePlatform, setServicePlatform] = useState<PlatformId | "all">("all");
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/admin");
    const json = await res.json();
    setData(json);
    setSelectedId((current) => current || json.users?.[0]?.id || "");
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab !== "services") return;
    fetch("/api/services?limit=all")
      .then((r) => r.json())
      .then((d) => setServices(d.services || []));
  }, [tab]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setMessage(json.error || "Saved");
    load();
  }

  async function credit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await post({ action: "credit", userId: form.get("userId"), amount: Number(form.get("amount")) });
  }

  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await post({
      action: "settings",
      markup: Number(form.get("markup")),
      depositNumber: form.get("depositNumber"),
      depositInstructions: form.get("depositInstructions"),
    });
  }

  const selected = useMemo(
    () => data?.users.find((user) => user.id === selectedId) || null,
    [data, selectedId],
  );
  const selectedOrders = useMemo(
    () => data?.orders.filter((order) => order.userId === selectedId) || [],
    [data, selectedId],
  );
  const selectedDeposits = useMemo(
    () => data?.deposits.filter((deposit) => deposit.userId === selectedId) || [],
    [data, selectedId],
  );
  const selectedTickets = useMemo(
    () => data?.tickets.filter((ticket) => ticket.userId === selectedId) || [],
    [data, selectedId],
  );
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !data) return data?.users || [];
    return data.users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(q));
  }, [data, query]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    const q = orderQ.trim().toLowerCase();
    return data.orders.filter((order) => {
      if (orderStatus !== "all" && (order.status || "Pending") !== orderStatus) return false;
      if (!q) return true;
      const owner = userName(data.users, order.userId).toLowerCase();
      return `${order.serviceName} ${order.link} ${order.providerOrderId} ${order.serviceId} ${owner}`.toLowerCase().includes(q);
    });
  }, [data, orderQ, orderStatus]);

  const filteredTx = useMemo(() => {
    if (!data) return [];
    const q = txQ.trim().toLowerCase();
    return data.deposits.filter((deposit) => {
      if (!q) return true;
      const owner = userName(data.users, deposit.userId).toLowerCase();
      return `${deposit.method} ${deposit.reference} ${deposit.phone} ${deposit.id} ${owner} ${deposit.status}`.toLowerCase().includes(q);
    });
  }, [data, txQ]);

  const filteredServices = useMemo(() => {
    const q = serviceQ.trim().toLowerCase();
    return services.filter((s) => {
      if (servicePlatform !== "all" && s.platform !== servicePlatform) return false;
      if (!q) return true;
      return `${s.service} ${s.name} ${s.category}`.toLowerCase().includes(q);
    });
  }, [services, serviceQ, servicePlatform]);

  const audit = useMemo(() => {
    if (!data) return [];
    const events: Array<{ at: string; kind: string; title: string; detail: string }> = [];
    for (const order of data.orders) {
      events.push({
        at: order.createdAt,
        kind: "Order",
        title: order.serviceName,
        detail: `${userName(data.users, order.userId)} · ${order.status || "Pending"} · charged ${money(order.charge, order.currency)} · cost ${money(order.cost || 0, order.currency)}`,
      });
    }
    for (const deposit of data.deposits) {
      events.push({
        at: deposit.resolvedAt || deposit.createdAt,
        kind: "Transaction",
        title: money(deposit.amount),
        detail: `${userName(data.users, deposit.userId)} · ${deposit.status} · ${deposit.method} · ${deposit.reference || deposit.phone || deposit.id}`,
      });
    }
    for (const ticket of data.tickets) {
      events.push({
        at: ticket.createdAt,
        kind: "Ticket",
        title: ticket.subject,
        detail: `${userName(data.users, ticket.userId)} · ${ticket.status} · ${ticket.messages.length} messages`,
      });
    }
    for (const user of data.users) {
      events.push({
        at: user.createdAt,
        kind: "User",
        title: user.name,
        detail: `${user.email} · ${user.role} · wallet ${money(user.balance)}`,
      });
    }
    return events.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [data]);

  if (!data?.stats) return <p className="text-sm text-zinc-500">Loading admin...</p>;

  const statuses = Object.keys(data.orderStatus || {}).sort();
  const apiUrl = typeof window === "undefined" ? "/api/v2" : `${window.location.origin}/api/v2`;

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Every user, wallet, order, transaction, service, and status. API lives here only."
      />
      {message && <p className="mb-4 text-sm text-emerald-300">{message}</p>}

      <div className="chip-row mb-6">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              tab === item.id
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Jeskie balance</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {data.provider.balance} {data.provider.currency}
              </p>
              <p className="mt-2 text-xs text-zinc-500">What the provider is holding</p>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">User wallets</p>
              <p className="mt-2 text-xl font-semibold text-white">{money(data.stats.walletTotal)}</p>
              <p className="mt-2 text-xs text-zinc-500">{data.stats.users} accounts</p>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Deposits in</p>
              <p className="mt-2 text-xl font-semibold text-white">{money(data.stats.deposited)}</p>
              <p className="mt-2 text-xs text-zinc-500">{data.stats.pendingDeposits} pending</p>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Markup profit</p>
              <p className="mt-2 text-xl font-semibold text-white">{money(data.stats.revenue)}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Charged {money(data.stats.spent)} · cost {money(data.stats.cost)}
              </p>
            </article>
          </section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Orders</p>
              <p className="mt-2 text-xl font-semibold text-white">{data.stats.orders}</p>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Open tickets</p>
              <p className="mt-2 text-xl font-semibold text-white">{data.stats.openTickets}</p>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Your wallet</p>
              <p className="mt-2 text-xl font-semibold text-white">{money(data.me.balance)}</p>
            </article>
            <article className="glass-card p-5">
              <p className="text-sm text-zinc-500">Live services</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {(data.stats.serviceCount || 0).toLocaleString()}
              </p>
            </article>
          </section>
          <section className="glass-card p-5">
            <h2 className="font-semibold text-white">Order status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {statuses.length ? (
                statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setOrderStatus(status);
                      setTab("orders");
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm"
                  >
                    <StatusBadge status={status} />
                    <span className="text-white">{data.orderStatus[status]}</span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No orders yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "users" && (
        <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="glass-card p-4">
            <h2 className="font-semibold">All users</h2>
            <input className="mt-3" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" />
            <div className="panel-scroll mt-3 max-h-[640px] space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedId(user.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left ${
                    selectedId === user.id ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {money(user.balance)} · {user.orderCount} orders
                  </p>
                </button>
              ))}
            </div>
          </aside>
          <div className="space-y-4">
            {selected ? (
              <>
                <article className="glass-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{selected.name}</h2>
                      <p className="text-sm text-zinc-400">{selected.email}</p>
                    </div>
                    <StatusBadge status={selected.role} />
                  </div>
                  <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <dt className="text-zinc-500">Wallet</dt>
                      <dd className="mt-1 font-medium">{money(selected.balance)}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Approved deposits</dt>
                      <dd className="mt-1 font-medium">{money(selected.depositTotal)}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Spent on orders</dt>
                      <dd className="mt-1 font-medium">{money(selected.spent)}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Joined</dt>
                      <dd className="mt-1 font-medium">{new Date(selected.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                </article>
                <article className="glass-card overflow-hidden">
                  <h3 className="border-b border-white/10 px-5 py-4 font-semibold">Orders ({selectedOrders.length})</h3>
                  {selectedOrders.length ? (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Qty</th>
                            <th>Charge</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                <p className="max-w-xl whitespace-normal break-words font-medium">{order.serviceName}</p>
                                <p className="text-xs text-zinc-500">
                                  #{order.serviceId} · {order.providerOrderId}
                                </p>
                              </td>
                              <td>{order.quantity}</td>
                              <td>{money(order.charge, order.currency)}</td>
                              <td>
                                <StatusBadge status={order.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-5 py-6 text-sm text-zinc-500">No orders for this user.</p>
                  )}
                </article>
                <article className="glass-card overflow-hidden">
                  <h3 className="border-b border-white/10 px-5 py-4 font-semibold">Transactions ({selectedDeposits.length})</h3>
                  {selectedDeposits.length ? (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Receipt</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDeposits.map((deposit) => (
                            <tr key={deposit.id}>
                              <td>{money(deposit.amount)}</td>
                              <td>{deposit.method}</td>
                              <td className="text-zinc-400">{deposit.reference || deposit.phone || "—"}</td>
                              <td>
                                <StatusBadge status={deposit.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-5 py-6 text-sm text-zinc-500">No deposits for this user.</p>
                  )}
                </article>
                <article className="glass-card overflow-hidden">
                  <h3 className="border-b border-white/10 px-5 py-4 font-semibold">Tickets ({selectedTickets.length})</h3>
                  {selectedTickets.length ? (
                    <div className="divide-y divide-white/10">
                      {selectedTickets.map((ticket) => (
                        <div key={ticket.id} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{ticket.subject}</p>
                            <StatusBadge status={ticket.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-6 text-sm text-zinc-500">No tickets for this user.</p>
                  )}
                </article>
              </>
            ) : (
              <p className="glass-card p-6 text-sm text-zinc-500">Select a user.</p>
            )}
          </div>
        </section>
      )}

      {tab === "orders" && (
        <section className="glass-card overflow-hidden">
          <div className="space-y-3 border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold text-white">All orders ({filteredOrders.length})</h2>
            <input value={orderQ} onChange={(e) => setOrderQ(e.target.value)} placeholder="Search user, service, link, ID" />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setOrderStatus("all")}
                className={`rounded-md border px-2 py-1 text-xs ${orderStatus === "all" ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-zinc-400"}`}
              >
                All
              </button>
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOrderStatus(status)}
                  className={`rounded-md border px-2 py-1 text-xs ${orderStatus === status ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-zinc-400"}`}
                >
                  {status} ({data.orderStatus[status]})
                </button>
              ))}
            </div>
          </div>
          {filteredOrders.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Charged</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="text-sm text-zinc-400">{userName(data.users, order.userId)}</td>
                      <td>
                        <p className="max-w-xl whitespace-normal break-words font-medium">{order.serviceName}</p>
                        <p className="text-xs text-zinc-500">#{order.providerOrderId}</p>
                      </td>
                      <td>{order.quantity}</td>
                      <td>{money(order.charge, order.currency)}</td>
                      <td>{money(order.cost || 0, order.currency)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-zinc-500">No orders match.</p>
          )}
        </section>
      )}

      {tab === "transactions" && (
        <section className="glass-card overflow-hidden">
          <div className="space-y-3 border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold text-white">All transactions ({filteredTx.length})</h2>
            <input value={txQ} onChange={(e) => setTxQ(e.target.value)} placeholder="Search user, receipt, phone, status" />
          </div>
          {filteredTx.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Receipt</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((deposit) => (
                    <tr key={deposit.id}>
                      <td className="text-sm text-zinc-400">{userName(data.users, deposit.userId)}</td>
                      <td className="font-medium">{money(deposit.amount)}</td>
                      <td>{deposit.method}</td>
                      <td className="text-zinc-400">{deposit.reference || deposit.phone || deposit.id}</td>
                      <td>
                        <StatusBadge status={deposit.status} />
                      </td>
                      <td className="text-xs text-zinc-500">
                        {new Date(deposit.resolvedAt || deposit.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-zinc-500">No transactions match.</p>
          )}
        </section>
      )}

      {tab === "services" && (
        <section className="glass-card overflow-hidden">
          <div className="space-y-3 border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold text-white">All services ({filteredServices.length})</h2>
            <input value={serviceQ} onChange={(e) => setServiceQ(e.target.value)} placeholder="Search catalogue" />
            <PlatformChips value={servicePlatform} onChange={setServicePlatform} size="sm" />
          </div>
          {filteredServices.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Service</th>
                    <th>You pay / 1k</th>
                    <th>Customer / 1k</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((s) => (
                    <tr key={s.service}>
                      <td className="text-zinc-500">{s.service}</td>
                      <td>
                        <div className="flex items-start gap-2">
                          <PlatformLogo id={s.platform} size={18} />
                          <p className="max-w-xl whitespace-normal break-words font-medium">{s.name}</p>
                        </div>
                      </td>
                      <td>{moneyRate(youPay(s))}</td>
                      <td className="text-zinc-400">{money(s.retailRate)}</td>
                      <td>
                        <Link href={`/order?service=${s.service}`} className="gold-btn px-3 py-1.5 text-xs">
                          Order
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-zinc-500">Loading or no services match.</p>
          )}
        </section>
      )}

      {tab === "audit" && (
        <section className="glass-card overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold text-white">Audit log</h2>
            <p className="mt-1 text-xs text-zinc-500">Every user join, deposit, order, and ticket, newest first.</p>
          </div>
          <div className="divide-y divide-white/10">
            {audit.slice(0, 200).map((event, i) => (
              <div key={`${event.kind}-${event.at}-${i}`} className="px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{event.kind}</p>
                  <p className="text-xs text-zinc-500">{new Date(event.at).toLocaleString()}</p>
                </div>
                <p className="mt-1 font-medium text-white">{event.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{event.detail}</p>
              </div>
            ))}
            {!audit.length && <p className="px-5 py-8 text-sm text-zinc-500">Nothing to audit yet.</p>}
          </div>
        </section>
      )}

      {tab === "api" && (
        <section className="mx-auto max-w-2xl space-y-4">
          <div className="glass-card space-y-4 p-6">
            <h2 className="font-semibold text-white">Admin API</h2>
            <p className="text-sm text-zinc-400">Only the admin key can call SMM v2. Regular users do not get API access.</p>
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">API URL</p>
              <code className="mt-2 block break-all rounded-lg bg-white/5 px-4 py-3 text-sm">{apiUrl}</code>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-zinc-500">Key</p>
              <code className="mt-2 block break-all rounded-lg bg-white/5 px-4 py-3 text-sm">{data.me.apiKey}</code>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="gold-btn px-4 py-2"
                onClick={async () => {
                  if (!data.me.apiKey) return;
                  await navigator.clipboard.writeText(data.me.apiKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied" : "Copy key"}
              </button>
              <button
                type="button"
                className="ghost-btn px-4 py-2"
                onClick={async () => {
                  await fetch("/api/account/api-key", { method: "POST" });
                  load();
                }}
              >
                Rotate key
              </button>
            </div>
          </div>
          <div className="glass-card p-6 text-sm leading-7 text-zinc-400">
            <p>POST actions: services, add, status, balance.</p>
            <p>Send key + action as form fields, same as PerfectPanel / Jeskie.</p>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          <form onSubmit={credit} className="glass-card space-y-3 p-6">
            <h2 className="font-semibold">Credit a wallet</h2>
            <div>
              <label htmlFor="userId">User</label>
              <select id="userId" name="userId" required key={selectedId} defaultValue={selectedId}>
                {data.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email} · {money(u.balance)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amount">Amount</label>
              <input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <button className="gold-btn px-4 py-2.5">Credit</button>
          </form>

          <section className="glass-card p-6">
            <h2 className="font-semibold">Pending deposits</h2>
            <div className="mt-4 space-y-3">
              {data.deposits
                .filter((d) => d.status === "pending")
                .map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/5 p-4">
                    <span className="text-sm">
                      {userName(data.users, d.userId)} · {money(d.amount)} · {d.reference || d.phone || d.id}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => post({ action: "deposit", depositId: d.id, amount: d.amount })}
                        className="gold-btn px-3 py-1.5 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => post({ action: "deposit", depositId: d.id, amount: 0 })}
                        className="ghost-btn px-3 py-1.5 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              {!data.deposits.some((d) => d.status === "pending") && (
                <p className="text-sm text-zinc-500">No pending deposits.</p>
              )}
            </div>
          </section>

          <form onSubmit={saveSettings} className="glass-card space-y-3 p-6">
            <h2 className="font-semibold">Pricing</h2>
            <div>
              <label htmlFor="markup">Markup multiplier</label>
              <input id="markup" name="markup" type="number" min="1" step="0.1" defaultValue={data.settings.markup} />
            </div>
            <button className="gold-btn px-4 py-2.5">Save settings</button>
          </form>
        </div>
      )}
    </div>
  );
}
