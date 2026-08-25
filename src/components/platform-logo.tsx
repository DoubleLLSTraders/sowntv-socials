"use client";

import type { PlatformId } from "@/lib/types";
import { PLATFORM_META } from "@/lib/platforms";
import { useId } from "react";

export function PlatformLogo({
  id,
  size = 28,
}: {
  id: PlatformId;
  size?: number;
}) {
  const gid = `ig${useId().replace(/:/g, "")}`;
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const };
  switch (id) {
    case "youtube":
      return (
        <svg {...common}>
          <path
            fill="#FF0000"
            d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81Z"
          />
          <path fill="#fff" d="M9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={gid} cx="30%" cy="107%" r="150%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#${gid})`} />
          <path
            fill="none"
            stroke="#fff"
            strokeWidth="1.7"
            d="M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z"
          />
          <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.7" />
          <circle cx="17.4" cy="6.6" r="1" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#000" />
          <path
            fill="#25F4EE"
            d="M14.4 5v8.05a3.15 3.15 0 1 1-2.7-3.12v1.76a1.5 1.5 0 1 0 1.05 1.43V5.9c.86.5 1.8.82 2.8.9V5Z"
            transform="translate(-0.6 0.4)"
          />
          <path
            fill="#FE2C55"
            d="M14.4 5v8.05a3.15 3.15 0 1 1-2.7-3.12v1.76a1.5 1.5 0 1 0 1.05 1.43V5.9c.86.5 1.8.82 2.8.9V5Z"
            transform="translate(0.6 -0.2)"
          />
          <path
            fill="#fff"
            d="M14.4 5v8.05a3.15 3.15 0 1 1-2.7-3.12v1.76a1.5 1.5 0 1 0 1.05 1.43V5.9c.86.5 1.8.82 2.8.9V5Z"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path
            fill="#fff"
            d="M15.4 12.4h-2v7h-2.9v-7H9v-2.4h1.5V8.6c0-1.5.7-3.8 3.8-3.8h2.3v2.5h-1.7c-.3 0-.8.1-.8.9v1.8h2.6l-.3 2.4Z"
          />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#000" stroke="rgba(255,255,255,.2)" />
          <path
            fill="#fff"
            d="M16.8 4.8h2.3L14.2 11l5.8 8.2h-4.5l-3.5-4.6-4 4.6H5.7L11 12.6 5.5 4.8h4.6l3.2 4.2 3.5-4.2Zm-.8 13.1h1.3L8.1 6.1H6.8l9.2 11.8Z"
          />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="12" fill="#229ED9" />
          <path
            fill="#fff"
            d="M17.9 7.2 6.7 11.5c-.8.3-.8.8-.1 1l2.9.9 1.1 3.4c.1.4.2.5.5.5.3 0 .4-.1.6-.3l1.6-1.6 3.3 2.4c.6.3 1 .2 1.2-.6l2.1-9.8c.2-.9-.3-1.3-.9-1.1Z"
          />
        </svg>
      );
    case "spotify":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="12" fill="#1DB954" />
          <path
            fill="#000"
            d="M17.3 16.4c-.2.4-.7.5-1.1.3-3-1.8-6.8-2.2-11.2-1.2-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.8-1.1 9.1-.6 12.4 1.4.5.2.5.7.2 1Zm1.5-3.2c-.3.5-.9.6-1.3.3-3.4-2.1-8.6-2.7-12.6-1.5-.5.1-1-.2-1.2-.7-.1-.5.2-1 .7-1.2 4.6-1.4 10.3-.7 14.2 1.7.4.3.6.9.2 1.4Zm.1-3.3C14.7 8 8.3 7.8 5 8.8c-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 3.8-1.1 10.9-.9 15.6 1.8.5.3.7 1 .4 1.6-.3.5-1 .7-1.5.4Z"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="4" fill="#0A66C2" />
          <path
            fill="#fff"
            d="M7.4 9.4H5.1v9.3h2.3V9.4ZM6.2 5.2A1.35 1.35 0 1 0 6.2 7.9 1.35 1.35 0 0 0 6.2 5.2ZM18.9 13.1c0-2.6-1.4-3.8-3.3-3.8-1.5 0-2.2.8-2.6 1.4V9.4h-2.3c0 .5 0 9.3 0 9.3h2.3v-5.2c.1-.4.3-1 1-1 1 0 1.3.6 1.3 1.6v4.6h2.3c0-4.2 0-5.6-1-5.6Z"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="12" fill="#25D366" />
          <path
            fill="#fff"
            d="M12 5.2A6.8 6.8 0 0 0 6.3 15.3L5.4 18.6l3.4-.9A6.8 6.8 0 1 0 12 5.2Zm3.9 9.6c-.2.5-1 .9-1.4 1-.4 0-.8.2-2.6-.6-2.2-1-3.6-3.4-3.7-3.6-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8.2-.2.4-.2.6-.2h.4c.1 0 .3 0 .5.4l.6 1.5c.1.2 0 .3 0 .5l-.3.5c-.1.2-.2.3 0 .5.4.6.8 1.1 1.4 1.6.5.4 1 .7 1.2.5l.5-.3c.2-.1.3 0 .5.1l1.5.9c.2.1.3.2.3.3 0 .3-.1.8-.4 1.1Z"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#27272a" />
          <circle cx="12" cy="12" r="4" fill="#fbbf24" />
        </svg>
      );
  }
}

export const PLATFORM_ORDER: PlatformId[] = [
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "x",
  "telegram",
  "spotify",
  "linkedin",
  "whatsapp",
];

export function PlatformChips({
  value,
  onChange,
  size = "md",
}: {
  value: PlatformId | "all";
  onChange: (id: PlatformId | "all") => void;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";
  const options: Array<PlatformId | "all"> = ["all", ...PLATFORM_ORDER, "other"];
  return (
    <div className="chip-row" role="tablist" aria-label="Platforms">
      {options.map((id) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border ${
              compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
            } ${
              active
                ? "border-white/25 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white"
            }`}
          >
            {id !== "all" ? <PlatformLogo id={id} size={compact ? 14 : 18} /> : null}
            {id === "all" ? "All" : PLATFORM_META[id].label}
          </button>
        );
      })}
    </div>
  );
}
