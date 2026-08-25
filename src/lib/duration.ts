export type ServiceTiming = {
  startLabel: string;
  speedLabel: string;
  unitsPerDay: number | null;
};

function parseCount(raw: string, suffix: string) {
  const n = Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  const key = suffix.toLowerCase();
  const mul = key === "b" ? 1_000_000_000 : key === "m" ? 1_000_000 : key === "k" ? 1_000 : 1;
  return n * mul;
}

export function parseServiceTiming(name: string, desc = ""): ServiceTiming {
  const hay = `${name}\n${desc}`;

  let startLabel = "";
  const startMatch = hay.match(
    /start(?:\s*time)?\s*[:|]?\s*(\d+\s*(?:[-–to]+)\s*\d+\s*(?:minutes?|mins?|hours?|hrs?|days?)|\d+\s*(?:minutes?|mins?|hours?|hrs?|days?))/i,
  );
  if (startMatch) startLabel = startMatch[1].replace(/\s+/g, " ").trim();
  else if (/instant start|instant/i.test(hay)) startLabel = "0–5 minutes";

  let unitsPerDay: number | null = null;
  const speedMatch =
    hay.match(/speed\s*[:|]?\s*(?:day\s*)?([\d.,]+)\s*([kmb])?/i) ||
    hay.match(/([\d.,]+)\s*([kmb])\s*\/\s*d(?:ay)?/i) ||
    hay.match(/day\s*([\d.,]+)\s*([kmb])?/i);
  if (speedMatch) unitsPerDay = parseCount(speedMatch[1], speedMatch[2] || "");

  const speedLabel = unitsPerDay
    ? `${new Intl.NumberFormat("en").format(unitsPerDay)} / day`
    : "";

  return { startLabel, speedLabel, unitsPerDay };
}

export function formatSpan(minutes: number) {
  if (minutes < 1) return "under 1 min";
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} min`;
  const hours = minutes / 60;
  if (hours < 48) {
    const rounded = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
    return `${rounded} hr`;
  }
  const days = hours / 24;
  const rounded = days < 10 ? Math.round(days * 10) / 10 : Math.round(days);
  return `${rounded} days`;
}

export function estimateDuration(opts: {
  name?: string;
  desc?: string;
  quantity: number;
  drip?: boolean;
  runs?: number;
  interval?: number;
}) {
  const timing = parseServiceTiming(opts.name || "", opts.desc || "");
  const parts: string[] = [];

  if (timing.startLabel) parts.push(`Starts in ${timing.startLabel}`);

  if (timing.unitsPerDay && opts.quantity > 0) {
    const deliveryMin = (opts.quantity / timing.unitsPerDay) * 24 * 60;
    const span = formatSpan(deliveryMin);
    parts.push(deliveryMin < 1 ? `${span} to complete` : `~${span} to complete`);
  }

  if (opts.drip && (opts.runs || 1) > 1) {
    const extra = ((opts.runs || 1) - 1) * Math.max(0, opts.interval || 0);
    if (extra > 0) parts.push(`+${formatSpan(extra)} drip-feed`);
  }

  if (timing.speedLabel) parts.push(timing.speedLabel);

  return {
    ...timing,
    label: parts.join(" · ") || "Not listed for this service",
  };
}
