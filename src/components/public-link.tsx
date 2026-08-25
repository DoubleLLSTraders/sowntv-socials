"use client";

import { ExternalLink } from "lucide-react";
import { publicHref } from "@/lib/public-link";

export function PublicLink({
  link,
  className = "",
  label,
}: {
  link: string;
  className?: string;
  label?: string;
}) {
  const href = publicHref(link);
  if (!href) {
    return <span className={`truncate text-zinc-500 ${className}`}>{link || "—"}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-w-0 items-center gap-1.5 text-red-400 hover:text-red-300 ${className}`}
    >
      <span className="truncate">{label || link}</span>
      <ExternalLink size={14} className="shrink-0" />
    </a>
  );
}
