import {
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  LogOut,
  Package,
  ShoppingCart,
  Wallet,
  Zap,
} from "lucide-react";
import { SownMark } from "@/components/sown-mark";
import { PlatformLogo } from "@/components/platform-logo";
import { StatusBadge } from "@/components/status-badge";
import type { PlatformId } from "@/lib/types";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "New order", icon: ShoppingCart, active: false },
  { label: "Services", icon: Package, active: false },
  { label: "Orders", icon: ListOrdered, active: false },
  { label: "Mass order", icon: Zap, active: false },
  { label: "Wallet", icon: Wallet, active: false },
  { label: "Support", icon: LifeBuoy, active: false },
];

const ORDERS: Array<{
  platform: PlatformId;
  name: string;
  link: string;
  qty: string;
  status: string;
}> = [
  {
    platform: "youtube",
    name: "YouTube Subscribers [HQ]",
    link: "youtube.com/@sowntv",
    qty: "2,500",
    status: "In progress",
  },
  {
    platform: "instagram",
    name: "Instagram Followers",
    link: "instagram.com/sowntv",
    qty: "5,000",
    status: "Completed",
  },
  {
    platform: "tiktok",
    name: "TikTok Views",
    link: "tiktok.com/@sowntv/video/73…",
    qty: "20,000",
    status: "Completed",
  },
  {
    platform: "youtube",
    name: "YouTube Watch Hours",
    link: "youtube.com/watch?v=8kL2…",
    qty: "4,000",
    status: "In progress",
  },
  {
    platform: "facebook",
    name: "Facebook Page Likes",
    link: "facebook.com/sowntv",
    qty: "1,200",
    status: "Pending",
  },
];

export function HeroPanel() {
  return (
    <div className="hero-stage" aria-hidden>
      <div className="hero-glow" />
      <div className="hero-bezel">
        <span className="hero-camera" />
        <div className="hero-screen">
          <div className="grid min-h-[420px] bg-black lg:grid-cols-[220px_1fr]">
            <aside className="hidden border-r border-white/10 bg-black p-4 lg:flex lg:flex-col">
              <div className="flex items-center gap-2.5 px-2 py-3">
                <SownMark size={28} />
                <span className="text-[15px] font-semibold tracking-tight text-white">
                  SownTV Socials
                </span>
              </div>
              <p className="mb-3 mt-2 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Operations
              </p>
              <nav className="flex flex-1 flex-col gap-0.5">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                        item.active
                          ? "bg-red-500 font-medium text-white"
                          : "text-zinc-400"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </div>
                  );
                })}
              </nav>
              <div className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500">
                <LogOut size={16} /> Sign out
              </div>
            </aside>

            <div className="min-w-0 bg-black">
              <header className="flex min-w-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">Alex Mwangi</p>
                  <p className="truncate text-xs text-zinc-500">alex@sowntv.com</p>
                </div>
                <div className="ml-auto rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-right">
                  <p className="text-[11px] font-medium text-zinc-500">Balance</p>
                  <p className="text-sm font-semibold text-white">12,480.00</p>
                </div>
              </header>

              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Dashboard</h2>
                <p className="mt-1 text-sm text-zinc-500">Welcome back, Alex.</p>

                <section className="mt-5 grid gap-3 sm:grid-cols-3">
                  <article className="panel-card p-4">
                    <p className="text-sm text-zinc-500">Wallet balance</p>
                    <p className="mt-2 text-xl font-semibold sm:text-2xl">12,480.00</p>
                    <p className="mt-2 text-sm font-medium text-red-400">Add funds</p>
                  </article>
                  <article className="panel-card p-4">
                    <p className="text-sm text-zinc-500">Live services</p>
                    <p className="mt-2 text-xl font-semibold sm:text-2xl">3,210</p>
                    <p className="mt-2 text-sm font-medium text-red-400">Browse catalogue</p>
                  </article>
                  <article className="panel-card p-4">
                    <p className="text-sm text-zinc-500">Orders</p>
                    <p className="mt-2 text-xl font-semibold sm:text-2xl">18</p>
                    <p className="mt-2 text-sm font-medium text-red-400">Place an order</p>
                  </article>
                </section>

                <section className="panel-card mt-4 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                    <h3 className="font-semibold">Recent orders</h3>
                    <p className="text-sm font-medium text-red-400">View all</p>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="hero-orders w-full min-w-[20rem] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        <th className="px-4 py-2.5 font-semibold">Service</th>
                        <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Link</th>
                        <th className="px-4 py-2.5 font-semibold">Qty</th>
                        <th className="px-4 py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ORDERS.map((order) => (
                        <tr key={order.name + order.link} className="border-t border-white/10">
                          <td className="px-4 py-3">
                            <span className="flex min-w-0 items-center gap-2.5 font-medium">
                              <span className="shrink-0">
                                <PlatformLogo id={order.platform} size={18} />
                              </span>
                              <span className="truncate">{order.name}</span>
                            </span>
                          </td>
                          <td className="hidden max-w-[200px] truncate px-4 py-3 text-zinc-500 sm:table-cell">
                            {order.link}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">{order.qty}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </section>
              </div>
            </div>
          </div>
          <div className="hero-glass" />
        </div>
      </div>
      <div className="hero-fade" />
    </div>
  );
}
