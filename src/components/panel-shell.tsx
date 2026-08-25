"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  LogOut,
  Menu,
  Package,
  Shield,
  ShoppingCart,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { Brand } from "./brand";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { syncFirebaseAccount } from "@/lib/firebase-store";
import { money } from "@/lib/platforms";
import type { PublicUser } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/order", label: "New order", icon: ShoppingCart },
  { href: "/services", label: "Services", icon: Package },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/mass-order", label: "Mass order", icon: Zap },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/tickets", label: "Support", icon: LifeBuoy },
];

export function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        if (d.user) syncFirebaseAccount({ user: d.user });
      })
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onWallet(event: Event) {
      const next = (event as CustomEvent<{ user?: PublicUser }>).detail?.user;
      if (next) setUser(next);
    }
    window.addEventListener("sowntv:wallet", onWallet);
    return () => window.removeEventListener("sowntv:wallet", onWallet);
  }, []);

  async function logout() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Cookie session is enough to lock the panel.
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
              active
                ? "border border-white/20 bg-white/10 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] backdrop-blur-xl"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={16} />
            {link.label}
          </Link>
        );
      })}
      {user?.role === "admin" && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className={`mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
            pathname === "/admin"
              ? "border border-white/20 bg-white/10 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] backdrop-blur-xl"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Shield size={16} />
          Admin
        </Link>
      )}
    </nav>
  );

  return (
    <div className="bg-black lg:h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden border-r border-white/10 bg-black p-4 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="px-2 py-3">
          <Brand invert size="sm" />
        </div>
        <p className="mb-4 mt-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">Operations</p>
        <div className="panel-scroll min-h-0 flex-1">{nav}</div>
        <button onClick={logout} className="ghost-btn mt-4 w-full py-2 text-sm">
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <div className="flex h-full w-full max-w-72 flex-col rounded-xl border border-white/10 bg-black p-4 text-white">
            <div className="mb-6 flex items-center justify-between">
              <Brand invert size="sm" />
              <button onClick={() => setOpen(false)} className="glass-icon-btn" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="panel-scroll min-w-0 bg-black lg:h-dvh">
        <header className="sticky top-0 z-20 flex min-w-0 items-center gap-2 border-b border-white/10 bg-black/50 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:gap-3 sm:px-4 lg:px-8 lg:pt-3">
          <button className="glass-icon-btn shrink-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="min-w-0 lg:block">
            <p className="truncate text-sm font-medium text-white">{user?.name || "Account"}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <div className="ml-auto shrink-0 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-right shadow-[0_1px_0_rgba(255,255,255,0.16)_inset] backdrop-blur-xl sm:px-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">Balance</p>
            <p className="money-figure text-[15px] font-semibold whitespace-nowrap text-white sm:text-base">
              {money(user?.balance || 0)}
            </p>
          </div>
        </header>
        <main className="px-3 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
