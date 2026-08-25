import { readOnly, withStore } from "./db";
import { listServices } from "./jeskie";
import { toRetail } from "./pricing";
import { parseRate } from "./rate";
import type { JeskieService, RetailService } from "./types";

const TTL_MS = 10 * 60 * 1000;

// Jeskie keeps retired services in its `services` payload, but with no category
// and a stale rate. `add` answers "Package or service not found" for them, so
// they must never reach the catalogue.
function providerActive(service: JeskieService) {
  const category = String(service.category ?? "").trim();
  if (!category || category.toLowerCase() === "null") return false;
  return parseRate(service.rate) > 0;
}

export async function getCatalog(force = false): Promise<{
  services: RetailService[];
  currency: string;
  markup: number;
  hidden: number;
}> {
  const cached = await readOnly((store) => ({
    cache: store.serviceCache,
    markup: store.settings.markup || Number(process.env.MARKUP_MULTIPLIER || 1),
    disabled: new Set((store.disabledServices || []).map((row) => String(row.service))),
  }));

  const orderable = (services: JeskieService[]) =>
    services.filter((s) => providerActive(s) && !cached.disabled.has(String(s.service)));

  const freshEnough =
    !force && cached.cache && Date.now() - cached.cache.at < TTL_MS && cached.cache.services.length > 0;

  if (freshEnough && cached.cache) {
    const active = orderable(cached.cache.services);
    return {
      services: active.map((s) => toRetail(s, cached.markup)),
      currency: cached.cache.currency,
      markup: cached.markup,
      hidden: cached.cache.services.length - active.length,
    };
  }

  const services = await listServices();
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "KES";
  await withStore((store) => {
    store.serviceCache = { at: Date.now(), currency, services };
  });

  const active = orderable(services);
  return {
    services: active.map((s) => toRetail(s, cached.markup)),
    currency,
    markup: cached.markup,
    hidden: services.length - active.length,
  };
}

export async function disableService(service: number, reason: string) {
  await withStore((store) => {
    if (!Array.isArray(store.disabledServices)) store.disabledServices = [];
    if (store.disabledServices.some((row) => Number(row.service) === Number(service))) return;
    store.disabledServices.push({
      service: Number(service),
      reason,
      at: new Date().toISOString(),
    });
  });
}
