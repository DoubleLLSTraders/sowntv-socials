export function publicHref(link: string | null | undefined) {
  const raw = String(link || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("@")) return `https://instagram.com/${raw.slice(1)}`;
  if (/^[\w.-]+\.[a-z]{2,}([/:].*)?$/i.test(raw)) return `https://${raw}`;
  return "";
}
