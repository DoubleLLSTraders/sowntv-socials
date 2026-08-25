"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { estimateDuration } from "@/lib/duration";
import { syncFirebaseAccount } from "@/lib/firebase-store";
import { wantsInstagramUsername } from "@/lib/order-link";
import { money, moneyRate, PLATFORM_META } from "@/lib/platforms";
import { orderCost, rateForUser } from "@/lib/pricing";
import { youPay } from "@/lib/rate";
import { PageHeader } from "@/components/status-badge";
import { PlatformLogo } from "@/components/platform-logo";
import { ServiceSelect } from "@/components/service-select";
import type { PublicUser, RetailService } from "@/lib/types";

export function OrderForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [services, setServices] = useState<RetailService[]>([]);
  const [serviceId, setServiceId] = useState(params.get("service") || "");
  const [quantity, setQuantity] = useState(1000);
  const [runs, setRuns] = useState(1);
  const [interval, setInterval] = useState(0);
  const [drip, setDrip] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);

  const loadServices = useCallback(async (refresh = false) => {
    const res = await fetch(`/api/services?limit=all${refresh ? "&refresh=1" : ""}`);
    const data = await res.json();
    setServices(data.services || []);
  }, []);

  useEffect(() => {
    loadServices();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));
  }, [loadServices]);

  const selected = useMemo(
    () => services.find((s) => String(s.service) === String(serviceId)),
    [services, serviceId],
  );

  const operator = user?.role === "admin";
  const unitRate = selected ? rateForUser(user?.role, selected) : 0;
  const charge = selected
    ? orderCost({
        type: selected.type,
        ratePerThousand: unitRate,
        quantity,
        runs: drip ? runs : 1,
      })
    : 0;
  const customerCharge = selected
    ? orderCost({
        type: selected.type,
        ratePerThousand: selected.retailRate,
        quantity,
        runs: drip ? runs : 1,
      })
    : 0;

  const duration = selected
    ? estimateDuration({
        name: selected.name,
        desc: selected.desc,
        quantity,
        drip,
        runs,
        interval,
      })
    : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: Number(selected.service),
        link: form.get("link"),
        quantity,
        comments: form.get("comments") || undefined,
        username: form.get("username") || undefined,
        min: form.get("min") ? Number(form.get("min")) : undefined,
        max: form.get("max") ? Number(form.get("max")) : undefined,
        posts: form.get("posts") ? Number(form.get("posts")) : undefined,
        delay: form.get("delay") ? Number(form.get("delay")) : undefined,
        runs: drip ? runs : undefined,
        interval: drip ? interval : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      setError(data.error || "Order failed");
      if (data.code === "service_gone") {
        setServiceId("");
        await loadServices(true);
      }
      return;
    }
    if (data.order) {
      syncFirebaseAccount({ orders: [data.order] });
      router.push(`/orders/${data.order.id}`);
      router.refresh();
      return;
    }
    setBusy(false);
    setError("Order was placed but could not be opened.");
  }

  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-8 h-64 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.18),transparent_65%)] blur-2xl"
      />
      <PageHeader title="New order" description="Search the catalogue, then submit a public link." />
      <form onSubmit={onSubmit} className="glass-card relative space-y-4 overflow-visible p-4 sm:p-6">
        <div>
          <label htmlFor="service">Service</label>
          <ServiceSelect services={services} value={serviceId} onChange={setServiceId} operator={operator} />
        </div>

        {selected && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-400">
            <div className="flex items-start gap-2.5">
              <PlatformLogo id={selected.platform} size={22} />
              <p className="min-w-0 whitespace-normal break-words font-medium text-white">{selected.name}</p>
            </div>
            <p className="mt-2">
              {selected.type} · Min {Number(selected.min).toLocaleString()} · Max {Number(selected.max).toLocaleString()}
            </p>
            <p className="mt-2 text-white">
              {operator ? (
                <>
                  You pay {moneyRate(youPay(selected))} / 1k
                  <span className="text-zinc-500"> · Customers pay {money(selected.retailRate)} / 1k</span>
                </>
              ) : (
                <>{money(selected.retailRate)} / 1k</>
              )}
            </p>
          </div>
        )}

        {!/subscription/i.test(selected?.type || "") && (
          <div>
            <label htmlFor="link">{selected && wantsInstagramUsername(selected) ? "Instagram username" : "Public link"}</label>
            <input
              id="link"
              name="link"
              required={!/subscription/i.test(selected?.type || "")}
              placeholder={
                selected && wantsInstagramUsername(selected)
                  ? "username  or  https://instagram.com/username"
                  : selected
                    ? PLATFORM_META[selected.platform].placeholder
                    : "https://..."
              }
            />
            {selected && wantsInstagramUsername(selected) ? (
              <p className="mt-1.5 text-xs text-zinc-500">This service wants the username. A profile URL is converted automatically.</p>
            ) : null}
          </div>
        )}

        {/custom comments/i.test(selected?.type || "") && (
          <div>
            <label htmlFor="comments">Comments</label>
            <textarea id="comments" name="comments" rows={6} placeholder="One comment per line" />
          </div>
        )}

        {/subscription/i.test(selected?.type || "") && (
          <>
            <div>
              <label htmlFor="username">Username</label>
              <input id="username" name="username" required placeholder="Username" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="min">Min per post</label>
                <input id="min" name="min" type="number" />
              </div>
              <div>
                <label htmlFor="max">Max per post</label>
                <input id="max" name="max" type="number" />
              </div>
              <div>
                <label htmlFor="posts">Future posts</label>
                <input id="posts" name="posts" type="number" />
              </div>
              <div>
                <label htmlFor="delay">Delay (minutes)</label>
                <input id="delay" name="delay" type="number" />
              </div>
            </div>
          </>
        )}

        {!/package|custom comments|subscription/i.test(selected?.type || "") && (
          <div>
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min={Number(selected?.min || 1)}
              max={Number(selected?.max || 1000000)}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
        )}

        <div>
          <label htmlFor="duration">Duration</label>
          <input
            id="duration"
            readOnly
            value={duration?.label || "Select a service to see start time and speed"}
          />
          {duration?.startLabel || duration?.speedLabel ? (
            <p className="mt-1.5 text-xs text-zinc-500">
              {duration.startLabel ? `Start ${duration.startLabel}` : "Start time not listed"}
              {duration.speedLabel ? ` · Speed ${duration.speedLabel}` : ""}
            </p>
          ) : null}
        </div>

        {selected && /default/i.test(selected.type || "Default") && (
          <label className="check-row">
            <input type="checkbox" checked={drip} onChange={(e) => setDrip(e.currentTarget.checked)} />
            Drip-feed delivery
          </label>
        )}

        {drip && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="runs">Runs</label>
              <input id="runs" type="number" min={1} value={runs} onChange={(e) => setRuns(Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="interval">Interval (minutes)</label>
              <input
                id="interval"
                type="number"
                min={0}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-zinc-400">{operator ? "Wallet debit" : "Charge"}</span>
            <strong className="text-white">{money(charge)}</strong>
          </div>
          {operator && selected ? (
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Provider cost for this quantity. Customers would pay {money(customerCharge)}
              {typeof selected.wholesaleRate === "number" && selected.wholesaleRate > 0
                ? ` (${Number((selected.retailRate / selected.wholesaleRate).toFixed(2))}× markup)`
                : ""}
              . Your own orders are not marked up.
            </p>
          ) : null}
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button disabled={busy || !selected} className="gold-btn w-full py-2.5">
          {busy ? "Placing order..." : "Place order"}
        </button>
      </form>
      {busy ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div className="panel-card flex max-w-sm flex-col items-center px-8 py-8 text-center">
            <span className="order-spinner" aria-hidden />
            <p className="mt-4 font-medium text-white">Placing your order</p>
            <p className="mt-1 text-sm text-zinc-500">Sending it to the panel. You’ll land on live tracking next.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
