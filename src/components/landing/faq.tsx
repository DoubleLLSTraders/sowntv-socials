"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "How are orders fulfilled?",
    a: "You place them in the SownTV panel. Fulfilment runs through a live wholesale provider in the background. Your customers only ever see SownTV.",
  },
  {
    q: "Do you ever need my password?",
    a: "Never. Only send public links — a video, profile, page, or track. Private account access is not part of the panel.",
  },
  {
    q: "What can I grow?",
    a: "YouTube, Instagram, TikTok, Facebook, X, Telegram, Spotify, LinkedIn, WhatsApp, and more. The live catalogue includes subscribers, views, watch hours, followers, members, plays, and engagement.",
  },
  {
    q: "Can I resell this?",
    a: "Yes. Wallet, markup, mass order, and tickets are built in. Your customers order inside SownTV. Fulfilment stays in the background.",
  },
  {
    q: "What about drops and refills?",
    a: "Delivery speed, drops, and refills follow the service you pick. Partial and canceled jobs are refunded according to the provider result.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-2">
      {ITEMS.map((item, index) => {
        const active = open === index;
        return (
          <div key={item.q} className="panel-card overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpen(active ? -1 : index)}
              aria-expanded={active}
            >
              <span className="font-semibold text-white">{item.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition ${active ? "rotate-180" : ""}`}
              />
            </button>
            {active && <p className="px-5 pb-5 text-sm leading-7 text-zinc-400">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
