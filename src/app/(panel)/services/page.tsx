"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cheapestFloors, instagramFollowersFirst, sortByYouPay } from "@/lib/floors";
import { money, moneyRate, PLATFORM_META } from "@/lib/platforms";
import { youPay } from "@/lib/rate";
import { PageHeader } from "@/components/status-badge";
import { PlatformChips, PlatformLogo } from "@/components/platform-logo";
import { ServiceDetailModal } from "@/components/service-detail";
import type { PlatformId, RetailService } from "@/lib/types";

function ServicesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("platform");
  const [services, setServices] = useState<RetailService[]>([]);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<PlatformId | "all">(
    requested && requested in PLATFORM_META ? (requested as PlatformId) : "all",
  );
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [markup, setMarkup] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preview, setPreview] = useState<RetailService | null>(null);

  function load(refresh = false) {
    const params = new URLSearchParams({ q, platform, limit: "all" });
    if (refresh) params.set("refresh", "1");
    return fetch(`/api/services?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setError("");
        setServices(d.services || []);
        setTotal(d.matched ?? d.total ?? 0);
        setMarkup(typeof d.markup === "number" ? d.markup : null);
      })
      .catch(() => setError("Could not load services."));
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load(false).finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, platform]);

  const floors = useMemo(() => cheapestFloors(services), [services]);
  const sorted = useMemo(() => instagramFollowersFirst(sortByYouPay(services)), [services]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Services"
          description={`${sorted.length.toLocaleString()} shown · Instagram followers first, then cheapest. ${total.toLocaleString()} in the live catalogue.`}
        />
        <button
          type="button"
          className="ghost-btn shrink-0 px-4 py-2 text-sm"
          disabled={refreshing || loading}
          onClick={() => {
            setRefreshing(true);
            load(true).finally(() => setRefreshing(false));
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh from API"}
        </button>
      </div>
      <div className="mb-4">
        <PlatformChips value={platform} onChange={setPlatform} />
      </div>
      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-zinc-500" />
        <input
          value={q}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Instagram followers, YouTube views..."
          className="!pl-10"
        />
      </div>
      {loading && <p className="mb-4 text-sm text-zinc-500">Loading live catalogue...</p>}
      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      {!q && floors.length > 0 && (
        <div className="panel-card mb-6 overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="font-medium text-white">What you pay Jeskie</p>
            <p className="mt-1 text-xs text-zinc-500">
              Cheapest live SKU for each product. KES per 1,000. This is the provider cost, not the customer price.
            </p>
          </div>
          <div className="divide-y divide-white/10">
            {floors.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => setPreview(row.service)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{row.label}</p>
                  <p className="mt-1 whitespace-normal break-words text-sm font-medium">
                    #{row.service.service} · {row.service.name}
                  </p>
                  <p className="money-figure mt-1 text-sm text-white">{moneyRate(row.pay)} / 1k</p>
                </div>
                <span className="gold-btn shrink-0 px-3 py-1.5 text-xs">View</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((s) => (
          <button
            key={s.service}
            type="button"
            onClick={() => setPreview(s)}
            className="glass-card w-full p-4 text-left hover:border-white/20"
          >
            <div className="flex items-start gap-3">
              <PlatformLogo id={s.platform} size={28} />
              <div className="min-w-0">
                <p className="whitespace-normal break-words text-sm font-medium text-white">{s.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  #{s.service} · {s.type}
                  {s.refill ? " · Refill" : ""}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Min {Number(s.min).toLocaleString()} · Max {Number(s.max).toLocaleString()}
                </p>
                <p className="money-figure mt-2 text-sm font-semibold text-white">{moneyRate(youPay(s))} / 1k</p>
                <p className="mt-0.5 text-xs text-zinc-500">Customer {money(s.retailRate)} / 1k</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Tap a card for start time, speed and description. You pay is Jeskie wholesale in KES.
        {markup && markup !== 1
          ? ` Customer is wholesale × ${markup}.`
          : " Customers see the same provider price — markup is off."}
      </p>

      {preview && (
        <ServiceDetailModal
          service={preview}
          actionLabel="Order this service"
          onClose={() => setPreview(null)}
          onAction={() => router.push(`/order?service=${preview.service}`)}
        />
      )}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesClient />
    </Suspense>
  );
}
