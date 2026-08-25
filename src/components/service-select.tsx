"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { PlatformChips, PlatformLogo } from "@/components/platform-logo";
import { ServiceDetailModal } from "@/components/service-detail";
import { instagramFollowersFirst } from "@/lib/floors";
import { moneyRate, PLATFORM_META } from "@/lib/platforms";
import { youPay } from "@/lib/rate";
import { foldText } from "@/lib/text";
import type { PlatformId, RetailService } from "@/lib/types";

function priceOf(s: RetailService, operator: boolean) {
  return moneyRate(operator ? youPay(s) : s.retailRate);
}

function tokensOf(q: string) {
  return foldText(q)
    .split(/[\s,/|]+/)
    .map((t) => t.replace(/^#/, ""))
    .filter(Boolean);
}

function haystack(s: RetailService) {
  return foldText(
    `${s.service} ${s.name} ${s.category || ""} ${s.type || ""} ${s.desc || ""} ${PLATFORM_META[s.platform].label}`,
  );
}

function matchesQuery(s: RetailService, tokens: string[]) {
  if (!tokens.length) return true;
  const hay = haystack(s);
  return tokens.every((t) => hay.includes(t) || String(s.service).includes(t));
}

function unitPrice(s: RetailService, operator: boolean) {
  const n = operator ? youPay(s) : Number(s.retailRate) || 0;
  return n > 0 ? n : Number.POSITIVE_INFINITY;
}

export function ServiceSelect({
  services,
  value,
  onChange,
  operator = false,
}: {
  services: RetailService[];
  value: string;
  onChange: (id: string) => void;
  operator?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<PlatformId | "all">("all");
  const [preview, setPreview] = useState<RetailService | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = services.find((s) => String(s.service) === String(value));

  const filtered = useMemo(() => {
    const tokens = tokensOf(q);
    const idQuery = tokens.length === 1 && /^\d+$/.test(tokens[0]) ? tokens[0] : "";
    const list = services
      .filter((s) => (platform === "all" || s.platform === platform) && matchesQuery(s, tokens))
      .sort((a, b) => {
        if (idQuery && String(a.service) === idQuery) return -1;
        if (idQuery && String(b.service) === idQuery) return 1;
        return unitPrice(a, operator) - unitPrice(b, operator) || Number(a.service) - Number(b.service);
      });
    return idQuery ? list : instagramFollowersFirst(list);
  }, [services, q, platform, operator]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (preview) setPreview(null);
        else setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [preview]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    } else {
      setQ("");
      setPlatform("all");
      setPreview(null);
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div>
      <button
        type="button"
        id="service"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex w-full items-start justify-between gap-3 rounded-lg border border-white/14 bg-white/[0.05] px-[0.85rem] py-[0.7rem] text-left text-[1rem] outline-none focus:border-[#ef4444] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.22)]"
      >
        <span className="flex min-w-0 flex-1 items-start gap-2.5">
          {selected ? (
            <span className="mt-0.5 shrink-0">
              <PlatformLogo id={selected.platform} size={22} />
            </span>
          ) : null}
          <span className="min-w-0 flex-1 whitespace-normal break-words">
            {selected ? (
              <>
                <span className="block text-white">
                  #{selected.service} · {selected.name}
                </span>
                <span className="mt-1 block text-sm text-zinc-400">{priceOf(selected, operator)} / 1k</span>
              </>
            ) : (
              <span className="text-zinc-500">Search Instagram followers, YouTube views...</span>
            )}
          </span>
        </span>
        <ChevronDown size={18} className="mt-1 shrink-0 text-zinc-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-picker-title"
            className="solid-sheet flex h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:h-auto sm:max-h-[88dvh] sm:rounded-[16px]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p id="service-picker-title" className="font-semibold text-white">
                  Find a service
                </p>
                <p className="text-xs text-zinc-500">
                  {filtered.length.toLocaleString()} services · Instagram followers first, then cheapest
                </p>
              </div>
              <button type="button" className="glass-icon-btn" aria-label="Close search" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="shrink-0 space-y-3 border-b border-white/10 p-3">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={searchRef}
                  value={q}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filtered[0]) setPreview(filtered[0]);
                    }
                  }}
                  placeholder="instagram followers, youtube views, #7192"
                  className="!pl-10"
                />
              </div>
              <PlatformChips value={platform} onChange={setPlatform} size="sm" />
            </div>
            <div className="panel-scroll min-h-0 flex-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {services.length === 0 ? (
                <p className="px-2 py-6 text-sm text-zinc-500">Loading catalogue...</p>
              ) : filtered.length === 0 ? (
                <p className="px-2 py-6 text-sm text-zinc-500">No services match that search.</p>
              ) : (
                <div className="grid gap-2">
                  {filtered.map((s) => {
                    const active = String(s.service) === String(value);
                    return (
                      <button
                        key={s.service}
                        type="button"
                        onClick={() => setPreview(s)}
                        className={`w-full rounded-xl border px-3 py-3 text-left ${
                          active
                            ? "border-red-400/50 bg-zinc-900"
                            : "border-white/12 bg-zinc-900 hover:border-white/25"
                        }`}
                      >
                        <span className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0">
                            <PlatformLogo id={s.platform} size={22} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block whitespace-normal break-words text-sm font-medium text-white">
                              {s.name}
                            </span>
                            <span className="mt-1 block text-xs text-zinc-500">
                              #{s.service} · {s.category} · Min {Number(s.min).toLocaleString()}
                            </span>
                            <span className="money-figure mt-2 block text-sm font-semibold text-white">
                              {priceOf(s, operator)} / 1k
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {preview && (
        <ServiceDetailModal
          service={preview}
          operator={operator}
          actionLabel="Use this service"
          onClose={() => setPreview(null)}
          onAction={() => {
            onChange(String(preview.service));
            setPreview(null);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
