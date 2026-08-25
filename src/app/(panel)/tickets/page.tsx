"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/status-badge";
import { syncFirebaseAccount } from "@/lib/firebase-store";
import type { Ticket } from "@/lib/types";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openId, setOpenId] = useState("");

  async function load() {
    const res = await fetch("/api/tickets");
    const data = await res.json();
    setTickets(data.tickets || []);
    if (data.tickets?.length) syncFirebaseAccount({ tickets: data.tickets });
  }

  useEffect(() => {
    load();
  }, []);

  async function createTicket(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: form.get("subject"), message: form.get("message") }),
    });
    (e.target as HTMLFormElement).reset();
    load();
  }

  async function reply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: openId, message: form.get("message") }),
    });
    (e.target as HTMLFormElement).reset();
    load();
  }

  const active = tickets.find((t) => t.id === openId);

  return (
    <div>
      <PageHeader title="Support" description="Open a ticket if an order needs attention." />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div>
          <form onSubmit={createTicket} className="panel-card space-y-3 p-5">
            <div>
              <label>Subject</label>
              <input name="subject" required />
            </div>
            <div>
              <label>Message</label>
              <textarea name="message" required rows={4} />
            </div>
            <button className="gold-btn w-full py-2.5">Open ticket</button>
          </form>
          <div className="mt-3 space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left backdrop-blur-xl ${
                  openId === t.id
                    ? "border-white/25 bg-white/10 shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <p className="break-words text-sm font-medium">{t.subject}</p>
                <p className="text-xs capitalize text-slate-500">{t.status}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="panel-card p-6">
          {!active && <p className="text-sm text-slate-500">Select a ticket.</p>}
          {active && (
            <div className="space-y-4">
              <h2 className="break-words font-semibold">{active.subject}</h2>
              {active.messages.map((m, i) => (
                <div key={i} className="rounded-lg bg-white/5 p-4">
                  <p className="text-xs font-medium uppercase text-slate-500">{m.from}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>
                </div>
              ))}
              {active.status === "open" && (
                <form onSubmit={reply} className="space-y-3">
                  <textarea name="message" required rows={3} placeholder="Reply" />
                  <button className="gold-btn px-4 py-2.5">Send</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
