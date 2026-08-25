"use client";

import { Printer, X } from "lucide-react";
import { SownMark } from "./sown-mark";
import { money } from "@/lib/platforms";
import type { Deposit, OrderRecord } from "@/lib/types";

export type ReceiptRow = { label: string; value: string; strong?: boolean };

export function formatReceiptDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} at ${time}`;
}

export function depositReceiptRows(deposit: Deposit, customer: string): ReceiptRow[] {
  return [
    { label: "Merchant", value: "SownTV Socials" },
    { label: "Amount", value: money(deposit.amount), strong: true },
    { label: "Provider", value: /payhero|lipwa|mpesa|m-pesa/i.test(deposit.method || "") ? "M-Pesa" : deposit.method || "M-Pesa" },
    { label: "Provider Ref", value: deposit.reference || deposit.providerRef || "—" },
    { label: "Payment Ref", value: deposit.id },
    { label: "Customer", value: customer || "—" },
    { label: "Date", value: formatReceiptDate(deposit.resolvedAt || deposit.createdAt) },
    { label: "Status", value: deposit.status === "approved" ? "Success" : deposit.status },
  ];
}

export function orderReceiptRows(order: OrderRecord, customer: string): ReceiptRow[] {
  return [
    { label: "Merchant", value: "SownTV Socials" },
    { label: "Amount", value: money(order.charge, order.currency), strong: true },
    { label: "Service", value: order.serviceName },
    { label: "Quantity", value: Number(order.quantity).toLocaleString() },
    { label: "Link", value: order.link || "—" },
    { label: "Order ID", value: String(order.providerOrderId || order.id) },
    { label: "Payment Ref", value: order.id },
    { label: "Customer", value: customer || "—" },
    { label: "Date", value: formatReceiptDate(order.createdAt) },
    { label: "Status", value: "Success" },
  ];
}

export function ReceiptModal({
  title,
  rows,
  onClose,
}: {
  title: string;
  rows: ReceiptRow[];
  onClose: () => void;
}) {
  function printReceipt() {
    document.body.classList.add("printing-receipt");
    const done = () => {
      document.body.classList.remove("printing-receipt");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    window.setTimeout(done, 400);
  }

  return (
    <div className="receipt-overlay fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[100dvh] w-full max-w-[420px] flex-col p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-h-[92vh] sm:p-0">
        <div className="receipt-sheet overflow-y-auto bg-white px-5 py-8 text-[#1a1a1a] sm:px-8 sm:py-10">
          <div className="flex justify-start">
            <SownMark size={52} />
          </div>
          <div className="mt-5 text-center">
            <p className="text-[1.35rem] font-bold tracking-tight text-[#e11d2a]">SownTV Socials</p>
            <p className="mt-1 text-sm italic text-zinc-500">Order YouTube, Instagram and TikTok growth from one panel.</p>
            <p className="mt-5 text-[13px] font-semibold tracking-[0.14em] text-[#e11d2a]">{title}</p>
          </div>
          <div className="mt-4 h-px bg-[#e11d2a]" />
          <dl className="mt-5 space-y-3 text-[15px]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-[#333]">{row.label}</dt>
                <dd
                  className={`min-w-0 break-all text-right ${row.strong ? "font-bold text-black" : "text-[#111]"}`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 h-px bg-[#e11d2a]" />
          <p className="mt-5 text-center text-sm text-zinc-500">Thank you for using SownTV Socials</p>
        </div>
        <div className="receipt-actions mt-3 flex gap-2">
          <button type="button" className="gold-btn flex-1 py-2.5" onClick={printReceipt}>
            <Printer size={16} />
            Print
          </button>
          <button type="button" className="ghost-btn flex-1 py-2.5" onClick={onClose}>
            <X size={16} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
