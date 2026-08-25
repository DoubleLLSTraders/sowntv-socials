import { detectPlatform } from "./platforms";
import { parseRate } from "./rate";
import { displayCategory } from "./text";
import type { JeskieService, RetailService } from "./types";

export function retailFor(service: JeskieService, markup: number) {
  const wholesale = parseRate(service.rate);
  return Number((wholesale * markup).toFixed(6));
}

export function toRetail(service: JeskieService, markup: number): RetailService {
  const wholesaleRate = parseRate(service.rate);
  return {
    ...service,
    category: displayCategory(service.category, service.name),
    wholesaleRate,
    retailRate: Number((wholesaleRate * markup).toFixed(6)),
    platform: detectPlatform(service.category || "", service.name),
  };
}

export function orderCost(opts: {
  type: string;
  ratePerThousand: number;
  quantity: number;
  runs?: number;
}) {
  const qty = opts.runs && opts.runs > 1 ? opts.quantity * opts.runs : opts.quantity;
  if (/package/i.test(opts.type)) {
    return Number(opts.ratePerThousand.toFixed(4));
  }
  return Number(((opts.ratePerThousand / 1000) * qty).toFixed(4));
}

export function rateForUser(
  role: string | undefined,
  service: { wholesaleRate?: number; retailRate: number },
) {
  if (role === "admin" && typeof service.wholesaleRate === "number" && service.wholesaleRate > 0) {
    return service.wholesaleRate;
  }
  return service.retailRate;
}
