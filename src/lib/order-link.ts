// Cheap Instagram follower SKUs on Jeskie ask for a username, not a profile URL.
// Sending the full URL is a common reason those orders sit in Pending.

export function instagramUsername(link: string) {
  const raw = String(link || "").trim();
  if (!raw) return "";
  if (raw.startsWith("@")) return raw.slice(1);
  const noScheme = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (!/^instagram\.com\//i.test(noScheme) && !noScheme.includes("/")) {
    return raw.replace(/^@/, "");
  }
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return "";
    const parts = url.pathname.split("/").filter(Boolean);
    const first = parts[0] || "";
    if (!first || /^(p|reel|reels|stories|tv|explore|accounts)$/i.test(first)) return "";
    return decodeURIComponent(first);
  } catch {
    return "";
  }
}

export function wantsInstagramUsername(service: { name?: string; desc?: string; category?: string | null }) {
  const hay = `${service.category || ""} ${service.name || ""} ${service.desc || ""}`;
  return /instagram/i.test(hay) && /username/i.test(hay) && !/\/p\/|post link|video link/i.test(hay);
}

export function providerLink(
  service: { name?: string; desc?: string; category?: string | null },
  link: string | undefined,
) {
  const raw = String(link || "").trim();
  if (!raw || !wantsInstagramUsername(service)) return raw;
  return instagramUsername(raw) || raw;
}
