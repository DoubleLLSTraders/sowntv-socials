"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function PayFailedPage() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const payload = { source: "sowntv", event: "lipwa-failed", id };
    if (window.parent !== window) {
      window.parent.postMessage(payload, window.location.origin);
      return;
    }
    const next = new URL("/wallet", window.location.origin);
    next.searchParams.set("failed", "1");
    window.location.replace(next.toString());
  }, [id]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black p-6 text-center text-white">
      <div>
        <p className="text-lg font-semibold">Payment was not completed</p>
        <p className="mt-2 text-sm text-zinc-400">You can close this and try again from the wallet.</p>
      </div>
    </main>
  );
}
