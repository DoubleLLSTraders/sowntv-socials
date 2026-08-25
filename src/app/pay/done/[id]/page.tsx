"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function PayDoneClient() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();

  useEffect(() => {
    const receipt =
      params.get("providerReference") ||
      params.get("provider_reference") ||
      params.get("receipt") ||
      params.get("mpesa") ||
      "";
    const payload = { source: "sowntv", event: "lipwa-done", id, receipt };
    if (window.parent !== window) {
      window.parent.postMessage(payload, window.location.origin);
      return;
    }
    const next = new URL("/wallet", window.location.origin);
    next.searchParams.set("paid", String(id || ""));
    if (receipt) next.searchParams.set("receipt", receipt);
    window.location.replace(next.toString());
  }, [id, params]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-6 text-center text-white">
      <div>
        <p className="text-lg font-semibold">Payment received</p>
        <p className="mt-2 text-sm text-zinc-400">Crediting your wallet and closing checkout…</p>
      </div>
    </main>
  );
}

export default function PayDonePage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-black" />}>
      <PayDoneClient />
    </Suspense>
  );
}
