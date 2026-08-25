import type { PlatformId } from "./types";

const RULES: Array<{ id: PlatformId; match: RegExp }> = [
  { id: "youtube", match: /youtube|\byt\b|watch hour|subscribers/i },
  { id: "instagram", match: /instagram|\big\b/i },
  { id: "tiktok", match: /tiktok|tik tok/i },
  { id: "facebook", match: /facebook|\bfb\b/i },
  { id: "x", match: /twitter|\bx\b|tweets?/i },
  { id: "telegram", match: /telegram|\btg\b/i },
  { id: "spotify", match: /spotify/i },
  { id: "linkedin", match: /linkedin/i },
  { id: "whatsapp", match: /whatsapp/i },
];

export const PLATFORM_META: Record<
  PlatformId,
  { label: string; color: string; placeholder: string }
> = {
  youtube: {
    label: "YouTube",
    color: "#ff4d4d",
    placeholder: "https://youtube.com/@channel or a video URL",
  },
  instagram: {
    label: "Instagram",
    color: "#f472b6",
    placeholder: "https://instagram.com/username",
  },
  tiktok: {
    label: "TikTok",
    color: "#67e8f9",
    placeholder: "https://tiktok.com/@username",
  },
  facebook: {
    label: "Facebook",
    color: "#60a5fa",
    placeholder: "https://facebook.com/page",
  },
  x: {
    label: "X / Twitter",
    color: "#e5e7eb",
    placeholder: "https://x.com/username",
  },
  telegram: {
    label: "Telegram",
    color: "#38bdf8",
    placeholder: "https://t.me/channel",
  },
  spotify: {
    label: "Spotify",
    color: "#34d399",
    placeholder: "https://open.spotify.com/track/...",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#7dd3fc",
    placeholder: "https://linkedin.com/in/username",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "#4ade80",
    placeholder: "https://wa.me/channel or group invite",
  },
  other: {
    label: "Other",
    color: "#fbbf24",
    placeholder: "https://...",
  },
};

export function detectPlatform(category: string, name: string): PlatformId {
  const hay = `${category} ${name}`;
  return RULES.find((rule) => rule.match.test(hay))?.id || "other";
}

export function money(amount: number, currency = process.env.NEXT_PUBLIC_CURRENCY || "KES") {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function moneyRate(amount: number, currency = process.env.NEXT_PUBLIC_CURRENCY || "KES") {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(4)}`;
  }
}
