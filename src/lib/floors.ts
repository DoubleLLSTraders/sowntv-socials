import type { RetailService } from "./types";
import { youPay } from "./rate";
import { foldText } from "./text";

type Test = (name: string, hay: string) => boolean;

const PRODUCTS: Array<{ label: string; test: Test }> = [
  {
    label: "Instagram followers (cheap mix)",
    test: (n, h) =>
      h.includes("instagram") &&
      n.includes("follower") &&
      !/hq real|100% real accounts/.test(n) &&
      (/old account|mix|cheap/.test(n) || /cheap mix/.test(h)),
  },
  {
    label: "Instagram followers (marked real)",
    test: (n, h) => h.includes("instagram") && n.includes("follower") && /100% real|real accounts/.test(n),
  },
  {
    label: "Instagram views",
    test: (n, h) => h.includes("instagram") && /\bviews?\b/.test(n) && !n.includes("follower"),
  },
  {
    label: "Telegram views",
    test: (n, h) => h.includes("telegram") && /\bviews?\b/.test(n),
  },
  {
    label: "TikTok views",
    test: (n, h) => /tiktok|tik tok/.test(h) && /\bviews?\b/.test(n) && !n.includes("follower") && !n.includes("like"),
  },
  {
    label: "Instagram likes",
    test: (n, h) => h.includes("instagram") && /\blikes?\b/.test(n) && !n.includes("follower"),
  },
  {
    label: "TikTok video likes",
    test: (n, h) => /tiktok|tik tok/.test(h) && /\blikes?\b/.test(n) && !n.includes("follower") && !n.includes("live"),
  },
  {
    label: "Facebook post likes",
    test: (n) => /facebook|\bfb\b/.test(n) && n.includes("post") && /\blikes?\b/.test(n),
  },
  {
    label: "Facebook followers",
    test: (n, h) => /facebook|\bfb\b/.test(h) && n.includes("follower"),
  },
  {
    label: "Spotify plays",
    test: (n, h) => h.includes("spotify") && /plays?|streams?/.test(n),
  },
  {
    label: "Telegram members",
    test: (n, h) => h.includes("telegram") && /members?/.test(n),
  },
  {
    label: "X / Twitter followers",
    test: (n, h) => /twitter|\bx\b/.test(h) && n.includes("follower"),
  },
  {
    label: "Facebook page likes",
    test: (n) => /facebook|\bfb\b/.test(n) && n.includes("page") && /\blikes?\b/.test(n),
  },
  {
    label: "YouTube views",
    test: (n, h) => /youtube/.test(h) && /\bviews?\b/.test(n) && !/search|seo|ping|subscriber|watch/.test(n),
  },
  {
    label: "TikTok followers",
    test: (n) => /tiktok|tik tok/.test(n) && n.includes("follower"),
  },
  {
    label: "YouTube subscribers",
    test: (n, h) => /youtube/.test(h) && /subscribers?/.test(`${n} ${h}`),
  },
];

export function isInstagramFollowers(service: { name?: string; category?: string | null }) {
  const hay = foldText(`${service.category || ""} ${service.name || ""}`);
  return hay.includes("instagram") && hay.includes("follower");
}

// Instagram followers is the product customers ask for most, so it leads every
// list. Stable partition, so the cheapest-first order inside each group holds.
export function instagramFollowersFirst<T extends { name?: string; category?: string | null }>(services: T[]) {
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const service of services) {
    (isInstagramFollowers(service) ? pinned : rest).push(service);
  }
  return [...pinned, ...rest];
}

export function sortByYouPay<T extends { wholesaleRate?: number; retailRate?: number; rate?: string | number }>(
  services: T[],
) {
  return services.slice().sort((a, b) => {
    const pa = youPay(a) || Number.POSITIVE_INFINITY;
    const pb = youPay(b) || Number.POSITIVE_INFINITY;
    return pa - pb;
  });
}

export function cheapestFloors(services: RetailService[]) {
  return PRODUCTS.map((product) => {
    const hits = services
      .map((s) => ({
        s,
        pay: youPay(s),
        name: foldText(s.name),
        hay: foldText(`${s.category || ""} ${s.name || ""}`),
      }))
      .filter((x) => x.pay > 0 && x.pay < 100000 && product.test(x.name, x.hay))
      .sort((a, b) => a.pay - b.pay);
    const top = hits[0];
    if (!top) return null;
    return { label: product.label, service: top.s, pay: top.pay };
  }).filter((row): row is { label: string; service: RetailService; pay: number } => Boolean(row));
}
