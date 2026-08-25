"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ReceiptModal, depositReceiptRows } from "@/components/receipt";
import { money } from "@/lib/platforms";
import { PageHeader, StatusBadge } from "@/components/status-badge";
import { syncFirebaseAccount } from "@/lib/firebase-store";
import { extractMpesaCode, normalizeMpesaReceipt } from "@/lib/mpesa";
import type { Deposit, PublicUser } from "@/lib/types";

const QUICK = [100, 250, 500, 1000, 2500, 5000];

type PayheroMessage = {
  paymentSuccess?: boolean;
  success?: boolean;
  status?: string;
  providerReference?: string;
  provider_reference?: string;
  user_reference?: string;
  userReference?: string;
  reference?: string;
  receipt?: string;
  MpesaReceiptNumber?: string;
  source?: string;
  event?: string;
  id?: string;
  data?: PayheroMessage;
};

function publishWallet(user?: PublicUser | null) {
  if (!user) return;
  window.dispatchEvent(new CustomEvent("sowntv:wallet", { detail: { user } }));
}

function payheroHost(origin: string) {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith("payhero.co.ke") || host.endsWith("payherokenya.com") || host.endsWith("lipwa.link");
  } catch {
    return false;
  }
}

function unwrapMessage(data: unknown): PayheroMessage | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as PayheroMessage;
  return payload.data && typeof payload.data === "object" ? { ...payload, ...payload.data } : payload;
}

export default function WalletPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading wallet...</p>}>
      <WalletClient />
    </Suspense>
  );
}

function WalletClient() {
  const params = useSearchParams();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [amount, setAmount] = useState(500);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState(params.get("paid") || "");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [receipt, setReceipt] = useState<Deposit | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pendingRef = useRef(pendingId);
  const receiptHint = useRef(params.get("receipt") || "");
  pendingRef.current = pendingId;

  const applyResult = useCallback((nextUser?: PublicUser | null, deposit?: Deposit | null) => {
    if (nextUser) {
      setUser(nextUser);
      publishWallet(nextUser);
    }
    if (!deposit) return false;
    setDeposits((current) => [deposit, ...current.filter((item) => item.id !== deposit.id)]);
    if (deposit.status === "approved") {
      setMessage(`Wallet credited ${money(deposit.amount)}.`);
      setPendingId("");
      setCheckoutUrl("");
      setReceipt(deposit);
      syncFirebaseAccount({ user: nextUser, deposits: [deposit] });
      return true;
    }
    if (deposit.status === "rejected") {
      setError("Payment was cancelled or failed. Try again.");
      setPendingId("");
      setCheckoutUrl("");
    }
    return false;
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/wallet");
    const data = await res.json();
    setUser(data.user);
    publishWallet(data.user);
    const rows = (data.deposits || []) as Deposit[];
    setDeposits(rows);
    syncFirebaseAccount({ user: data.user, deposits: rows });
    const currentId = pendingRef.current;
    if (currentId) {
      const row = rows.find((item) => item.id === currentId);
      if (row?.status === "approved" || row?.status === "rejected") applyResult(data.user, row);
    } else if (data.credited?.[0]) {
      applyResult(data.user, data.credited[0]);
    }
    if (data.syncError) setError(`PayHero: ${data.syncError}`);
    return rows;
  }, [applyResult]);

  async function syncDeposit(id: string, extra?: { receipt?: string; reference?: string }) {
    const receipt = normalizeMpesaReceipt(extra?.receipt || receiptHint.current);
    if (receipt) receiptHint.current = receipt;
    const res = await fetch("/api/wallet/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, receipt: receipt || undefined, reference: extra?.reference }),
    });
    const data = await res.json();
    applyResult(data.user, data.deposit);
    return data.deposit as Deposit | undefined;
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pendingId) return;
    let stopped = false;
    setConfirming(true);
    const tick = async () => {
      const deposit = await syncDeposit(pendingId);
      if (stopped) return;
      if (deposit?.status === "pending") await load();
    };
    tick();
    const timer = setInterval(tick, 4000);
    const stop = setTimeout(() => {
      stopped = true;
      clearInterval(timer);
    }, 600000);
    return () => {
      stopped = true;
      setConfirming(false);
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [pendingId, load]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const payload = unwrapMessage(event.data);
      const code = extractMpesaCode(event.data) || (payload ? extractMpesaCode(payload) : "");
      if (code) receiptHint.current = code;
      const local = event.origin === window.location.origin && payload?.source === "sowntv";
      if (local && payload?.event === "lipwa-done" && (payload.id || pendingRef.current)) {
        const id = String(payload.id || pendingRef.current);
        if (payload.receipt) receiptHint.current = payload.receipt;
        setPendingId(id);
        syncDeposit(id, { receipt: payload.receipt || code, reference: payload.id });
        return;
      }
      if (local && payload?.event === "lipwa-failed") {
        setError("Payment was cancelled or failed. Try again.");
        setPendingId("");
        setCheckoutUrl("");
        return;
      }
      if (code && pendingRef.current && payheroHost(event.origin)) {
        syncDeposit(pendingRef.current, { receipt: code });
      }
      if (!payload || !payheroHost(event.origin)) return;
      const ok =
        payload.paymentSuccess === true ||
        payload.success === true ||
        /success/i.test(payload.status || "");
      if (!ok) return;
      const receiptCode =
        normalizeMpesaReceipt(
          String(payload.providerReference || payload.provider_reference || payload.MpesaReceiptNumber || payload.receipt || code || ""),
        ) || code;
      const reference = payload.user_reference || payload.userReference || payload.reference || pendingRef.current;
      if (receiptCode) receiptHint.current = receiptCode;
      if (reference) setPendingId(String(reference));
      syncDeposit(String(reference || pendingRef.current), { receipt: receiptCode, reference: String(reference || "") });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const waiting = useMemo(
    () => deposits.find((item) => item.id === pendingId && item.status === "pending"),
    [deposits, pendingId],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not start checkout.");
      return;
    }
    if (data.lipwaUrl) {
      setCheckoutUrl(data.lipwaUrl);
      if (data.deposit?.id) setPendingId(data.deposit.id);
      return;
    }
    setError("Lipwa checkout URL was not returned. Check PayHero settings.");
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-8 h-64 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.18),transparent_65%)] blur-2xl"
      />
      <PageHeader title="Wallet" description="Add funds with M-Pesa. Lipwa checkout opens inside this dashboard." />

      <article className="glass-card relative p-4 sm:p-6">
        <p className="text-sm text-zinc-400">Available balance</p>
        <p className="money-figure mt-2 text-3xl font-semibold tracking-tight text-white">{money(user?.balance || 0)}</p>
      </article>

      <form onSubmit={onSubmit} className="glass-card relative mt-4 space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="font-semibold text-white">Add funds</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Enter amount and M-Pesa number. Checkout stays in the panel — you never leave the dashboard.
          </p>
        </div>
        <div>
          <label htmlFor="amount">Amount (KES)</label>
          <input
            id="amount"
            type="number"
            min={10}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  amount === value
                    ? "border-red-400/50 bg-red-500/15 text-white"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20"
                }`}
              >
                {money(value)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="phone">M-Pesa number</label>
          <input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {waiting && !checkoutUrl && (
          <p className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
            Checking Lipwa payment. Keep this page open.
          </p>
        )}
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {params.get("failed") && !error && (
          <p className="text-sm text-rose-400">Checkout was cancelled. You can try again.</p>
        )}
        <button disabled={busy} className="gold-btn w-full py-2.5">
          {busy ? "Opening checkout..." : `Pay ${money(amount || 0)}`}
        </button>
      </form>

      <section className="glass-card relative mt-4 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-white">Recent deposits</h2>
        </div>
        {deposits.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Receipt</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {deposits.slice(0, 12).map((d) => (
                  <tr key={d.id}>
                    <td>{money(d.amount)}</td>
                    <td className="text-zinc-400">{d.reference || d.phone || "—"}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      {d.status === "approved" ? (
                        <button type="button" className="ghost-btn px-2.5 py-1 text-xs" onClick={() => setReceipt(d)}>
                          View receipt
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-zinc-500">No deposits yet.</p>
        )}
      </section>

      {checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 p-0 sm:p-3 lg:p-6">
          <div className="glass-card relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none sm:h-auto sm:rounded-[16px]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
              <div className="min-w-0">
                <p className="font-semibold text-white">Lipwa checkout</p>
                <p className="text-xs text-zinc-500">
                  Pay on Lipwa. After M-Pesa succeeds, keep this open — we credit the wallet and close it.
                </p>
              </div>
              <button
                type="button"
                className="glass-icon-btn"
                aria-label="Close checkout"
                onClick={() => setCheckoutUrl("")}
              >
                <X size={16} />
              </button>
            </div>
            <iframe
              title="PayHero Lipwa checkout"
              src={checkoutUrl}
              className="min-h-[55vh] w-full flex-1 bg-white sm:min-h-[70vh]"
              allow="payment *; clipboard-write"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <p className="min-w-0 flex-1 text-xs text-zinc-400">
                {error || (confirming ? "Confirming payment with PayHero..." : "Your wallet updates automatically once M-Pesa confirms.")}
              </p>
              <button type="button" className="ghost-btn px-3 py-2 text-xs" onClick={() => setCheckoutUrl("")}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <ReceiptModal
          title="PAYMENT RECEIPT"
          rows={depositReceiptRows(receipt, user?.name || user?.email || "")}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
