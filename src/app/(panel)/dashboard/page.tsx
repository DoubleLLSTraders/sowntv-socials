import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Package,
  ShoppingCart,
  Wallet,
  Zap,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { readOnly } from "@/lib/db";
import { money, PLATFORM_META } from "@/lib/platforms";
import type { PlatformId } from "@/lib/types";
import { PageHeader, StatusBadge } from "@/components/status-badge";
import { PlatformLogo } from "@/components/platform-logo";
import { PublicLink } from "@/components/public-link";

function isOpen(status: string) {
  return !/completed|canceled|cancelled|refunded|partial/i.test(status || "");
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { orders, deposits } = await readOnly((store) => ({
    orders: store.orders.filter((order) => order.userId === user.id),
    deposits: store.deposits.filter((deposit) => deposit.userId === user.id),
  }));

  let serviceCount = 0;
  let catalogError = "";
  try {
    const catalog = await getCatalog();
    serviceCount = catalog.services.length;
  } catch (error) {
    catalogError = error instanceof Error ? error.message : "Catalogue is unavailable.";
  }

  const openOrders = orders.filter((order) => isOpen(order.status));
  const spent = orders.reduce((sum, order) => sum + (Number(order.charge) || 0), 0);
  const pendingDeposits = deposits.filter((deposit) => deposit.status === "pending");
  const recent = orders.slice(0, 8);
  const networks = Object.keys(PLATFORM_META) as PlatformId[];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back${user.name ? `, ${user.name}` : ""}. Wallet, orders, and catalogue in one place.`}
      />
      {catalogError && (
        <p className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {catalogError}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="panel-card p-5">
          <p className="text-sm text-zinc-500">Wallet</p>
          <p className="money-figure mt-2 text-2xl font-semibold tracking-tight text-white">{money(user.balance)}</p>
          <Link href="/wallet" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-400">
            Add funds <ArrowUpRight size={14} />
          </Link>
        </article>
        <article className="panel-card p-5">
          <p className="text-sm text-zinc-500">Open orders</p>
          <p className="mt-2 text-2xl font-semibold text-white">{openOrders.length}</p>
          <p className="mt-3 text-sm text-zinc-500">{orders.length} total placed</p>
        </article>
        <article className="panel-card p-5">
          <p className="text-sm text-zinc-500">Spent</p>
          <p className="mt-2 text-2xl font-semibold text-white">{money(spent)}</p>
          <p className="mt-3 text-sm text-zinc-500">All-time order charges</p>
        </article>
        <article className="panel-card p-5">
          <p className="text-sm text-zinc-500">Live services</p>
          <p className="mt-2 text-2xl font-semibold text-white">{serviceCount.toLocaleString()}</p>
          <Link href="/services" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-400">
            Browse catalogue <ArrowUpRight size={14} />
          </Link>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="panel-card p-5">
          <h2 className="font-semibold text-white">Quick actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/order" className="gold-btn justify-start px-4 py-3">
              <ShoppingCart size={16} /> New order
            </Link>
            <Link href="/wallet" className="ghost-btn justify-start px-4 py-3">
              <Wallet size={16} /> Add funds
            </Link>
            <Link href="/services" className="ghost-btn justify-start px-4 py-3">
              <Package size={16} /> Services
            </Link>
            <Link href="/mass-order" className="ghost-btn justify-start px-4 py-3">
              <Zap size={16} /> Mass order
            </Link>
          </div>
        </article>
        <article className="panel-card p-5">
          <h2 className="font-semibold text-white">Order by network</h2>
          <div className="mt-4 chip-row">
            {networks.map((id) => (
              <Link
                key={id}
                href={`/services?platform=${id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-300 hover:border-white/20 hover:text-white"
              >
                <PlatformLogo id={id} size={18} />
                {PLATFORM_META[id].label}
              </Link>
            ))}
          </div>
          {pendingDeposits.length > 0 && (
            <p className="mt-5 text-sm text-zinc-500">
              {pendingDeposits.length} deposit{pendingDeposits.length === 1 ? "" : "s"} waiting for admin approval.
            </p>
          )}
        </article>
      </section>

      <section className="panel-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <h2 className="font-semibold text-white">Recent orders</h2>
          <Link href="/orders" className="text-sm font-medium text-red-400">
            View all
          </Link>
        </div>
        {recent.length ? (
          <>
          <div className="divide-y divide-white/10 md:hidden">
            {recent.map((order) => (
              <article key={order.id} className="px-4 py-3">
                <Link href={`/orders/${order.id}`} className="block break-words font-medium hover:text-red-400">
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
              </article>
            ))}
          </div>
          <div className="table-wrap hidden md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Link</th>
                  <th>Qty</th>
                  <th>Charge</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">
                      <Link href={`/orders/${order.id}`} className="hover:text-red-400">
                        {order.serviceName}
                      </Link>
                    </td>
                    <td className="max-w-[240px]">
                      <PublicLink link={order.link} className="text-sm" />
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
          </>
        ) : (
          <div className="px-5 py-10">
            <p className="text-sm text-zinc-500">No orders yet. Pick a service and send the first one.</p>
            <Link href="/order" className="gold-btn mt-4 px-4 py-2">
              Place an order
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
