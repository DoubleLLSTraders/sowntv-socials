"use client";

import { X } from "lucide-react";
import { estimateDuration } from "@/lib/duration";
import { money, moneyRate, PLATFORM_META } from "@/lib/platforms";
import { youPay } from "@/lib/rate";
import { PlatformLogo } from "@/components/platform-logo";
import type { RetailService } from "@/lib/types";

export function ServiceFacts({ service, operator = false }: { service: RetailService; operator?: boolean }) {
  const duration = estimateDuration({
    name: service.name,
    desc: service.desc,
    quantity: Math.max(Number(service.min) || 1000, 1000),
  });

  return (
    <div className="space-y-3 text-sm text-zinc-400">
      <div className="flex items-start gap-3">
        <PlatformLogo id={service.platform} size={36} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{PLATFORM_META[service.platform].label}</p>
          <p className="mt-1 whitespace-normal break-words text-base font-semibold text-white">{service.name}</p>
        </div>
      </div>
      {service.category ? <p className="whitespace-normal break-words">{service.category}</p> : null}
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dt className="text-zinc-500">Service ID</dt>
          <dd className="mt-1 font-medium text-white">#{service.service}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dt className="text-zinc-500">Type</dt>
          <dd className="mt-1 font-medium text-white">{service.type || "Default"}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dt className="text-zinc-500">Min / Max</dt>
          <dd className="mt-1 font-medium text-white">
            {Number(service.min).toLocaleString()} – {Number(service.max).toLocaleString()}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dt className="text-zinc-500">{operator ? "You pay / 1k" : "Price / 1k"}</dt>
          <dd className="money-figure mt-1 font-semibold text-white">
            {operator ? moneyRate(youPay(service)) : money(service.retailRate)}
          </dd>
        </div>
        {operator ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <dt className="text-zinc-500">Customer / 1k</dt>
            <dd className="money-figure mt-1 font-medium text-white">{money(service.retailRate)}</dd>
          </div>
        ) : null}
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dt className="text-zinc-500">Options</dt>
          <dd className="mt-1 font-medium text-white">
            {[service.refill ? "Refill" : null, service.cancel ? "Cancel" : null].filter(Boolean).join(" · ") || "—"}
          </dd>
        </div>
      </dl>
      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
        <p className="text-zinc-500">Start and speed</p>
        <p className="mt-1 text-white">
          {duration.startLabel ? `Start ${duration.startLabel}` : "Start time not listed"}
          {duration.speedLabel ? ` · Speed ${duration.speedLabel}` : ""}
        </p>
      </div>
      {service.desc ? (
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Details</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{service.desc}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ServiceDetailModal({
  service,
  actionLabel,
  onAction,
  onClose,
  operator = false,
}: {
  service: RetailService;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
  operator?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-detail-title"
        className="solid-sheet flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-[16px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p id="service-detail-title" className="font-semibold text-white">
            Service details
          </p>
          <button type="button" className="glass-icon-btn" aria-label="Close details" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="panel-scroll min-h-0 flex-1 px-4 py-4">
          <ServiceFacts service={service} operator={operator} />
        </div>
        <div className="flex gap-2 border-t border-white/10 p-4">
          <button type="button" className="ghost-btn flex-1 py-2.5" onClick={onClose}>
            Back
          </button>
          <button type="button" className="gold-btn flex-1 py-2.5" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
