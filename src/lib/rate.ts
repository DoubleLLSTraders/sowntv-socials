export function parseRate(raw: string | number | undefined | null) {
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : 0;
  const n = Number(String(raw ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function youPay(service: { wholesaleRate?: number; retailRate?: number; rate?: string | number }) {
  if (typeof service.wholesaleRate === "number" && service.wholesaleRate > 0) return service.wholesaleRate;
  if (typeof service.retailRate === "number" && service.retailRate > 0) return service.retailRate;
  return parseRate(service.rate);
}
