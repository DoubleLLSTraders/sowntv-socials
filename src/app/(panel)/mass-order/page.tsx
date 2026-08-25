"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/status-badge";

export default function MassOrderPage() {
  const [results, setResults] = useState<Array<{ line: string; ok: boolean; error?: string; orderId?: string }>>([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/orders/mass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: form.get("lines") }),
    });
    const data = await res.json();
    setBusy(false);
    setResults(data.results || [{ line: "", ok: false, error: data.error }]);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mass order" description="One order per line: serviceId|link|quantity" />
      <form onSubmit={onSubmit} className="panel-card space-y-4 p-4 sm:p-6">
        <textarea
          name="lines"
          rows={10}
          placeholder={"101|https://youtube.com/@channel|1000\n245|https://instagram.com/p/xxxxx|500"}
        />
        <button disabled={busy} className="gold-btn w-full py-2.5">
          {busy ? "Placing..." : "Submit batch"}
        </button>
      </form>
      <div className="mt-4 space-y-2 text-sm">
        {results.map((r, i) => (
          <p key={i} className={`break-all ${r.ok ? "text-emerald-700" : "text-rose-600"}`}>
            {r.ok ? `OK ${r.orderId}` : r.error} — {r.line}
          </p>
        ))}
      </div>
    </div>
  );
}
